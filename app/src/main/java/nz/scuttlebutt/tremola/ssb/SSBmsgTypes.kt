package nz.scuttlebutt.tremola.ssb

import android.util.Base64
import android.util.Log
import nz.scuttlebutt.tremola.ssb.core.Crypto
import nz.scuttlebutt.tremola.ssb.core.Crypto.Companion.sha256
import nz.scuttlebutt.tremola.ssb.db.entities.Event
import nz.scuttlebutt.tremola.ssb.db.entities.LogEntry
import nz.scuttlebutt.tremola.utils.HelperFunctions.Companion.deRef
import nz.scuttlebutt.tremola.utils.HelperFunctions.Companion.toBase64
import nz.scuttlebutt.tremola.utils.Json_PP
import org.json.JSONArray
import org.json.JSONObject

class SSBmsgTypes(val tremolaState: TremolaState) {
    private val id = tremolaState.idStore.identity
    private val me = id.toRef()

    private fun mkWire(ctxt: Any): String { // creates the log entry bytes but does not persist them
        val prev = tremolaState.logDAO.getMostRecentEventFromLogId(me)
        if (prev == null)
            return id.signSSBEvent(null, 1, ctxt)
        return id.signSSBEvent(prev.hid, prev.lsq + 1, ctxt)
    }

    fun mkEvent(name: String, time: String, date: String, author: String, description: String): String {
        // Create an event JSONObject
        val event = JSONObject()
        event.put("type", "event")
        event.put("author", author)
        event.put("name", name)
        event.put("date", date)
        event.put("time", time)
        event.put("description", description)

        // Return the signed SSB event
        return mkWire(event)
    }


    fun mkPost(text: String, toWhom: List<String>): String {
        val recps = JSONArray()
        val keys: MutableList<ByteArray> = mutableListOf<ByteArray>()
        for (r in toWhom)
            if (r != me) {
                recps.put(r)
                keys.add(r.deRef())
            }
        recps.put(me)
        keys.add(me.deRef())
        val post = JSONObject()
        post.put("type", "post")
        post.put("text", text)
        post.put("recps", recps)
        post.put("mentions", JSONArray())
        Log.d("PRIV_POST", post.toString())
        val ctxt = id.encryptPrivateMessage(post.toString(), keys)
        Log.d("PRIV_POST", ctxt)
        return mkWire(ctxt)
    }

    fun mkFollow(target: String, following: Boolean = true): String {
        val contact = JSONObject()
        contact.put("type", "contact")
        contact.put("contact", target)
        contact.put("following", following.toString())
        return mkWire(contact)
    }

    fun jsonToLogEntry(json: String, raw: ByteArray): LogEntry? {
        // Converts log entry in JSON, with or without envelope, to internal data structure
        // but only if the signature is valid
        try {
            var value = json
            val eTree = JSONObject(json)

            var vTree = eTree // the "value" (SSB log entry)
            if (eTree.has("value")) { // eTree is an envelope, remove it
                value = eTree.getString("value")
                vTree = eTree.getJSONObject("value")
            }
            if (!vTree.has("author")) { // not a message
                Log.d("parse", "no author?")
                return null
            }
            val msg = Json_PP().makePretty(value)

            val key: String
            if (eTree.has("key"))
                key = eTree.getString("key")
            else
                key = "%" + msg.encodeToByteArray().sha256().toBase64() + ".sha256"
            val author = vTree.getString("author")
            val seq = vTree.getInt("sequence")
            val pre = if (seq == 1) null else vTree.getString("previous")
            val signature = vTree.getString("signature").removeSuffix(".sig.ed25519")
            val sig = Base64.decode(signature, Base64.NO_WRAP)

            val msg2 = msg.slice(0..msg.indexOf(",\n  \"signature\":", msg.length - 130) - 1) + "\n}"
            if (!Crypto.verifySignDetached(sig, msg2.encodeToByteArray(), author.deRef())) {
                Log.d("SIGNATURE2", "**invalid** for ${author}/${seq}")
                return null
            }

            var content: JSONObject? = null
            try {
                val contentStr = vTree.getString("content")
                val decryptedContentStr = id.decryptPrivateMessage(contentStr)
                if (decryptedContentStr != null) {
                    content = JSONObject(String(decryptedContentStr))
                }
            } catch (ex: Exception) {
                content = vTree.getJSONObject("content")
            }

            var public: String? = null
            var confid: String? = null
            if (content != null) {
                public = content.toString()
                confid = null
            }
            return LogEntry(
                key, author,
                seq, pre, vTree.getLong("timestamp"),
                null, null,  // cid and clt
                public, confid, raw
            )

        } catch (e: Exception) {
            Log.d("MSG NOT PARSED", e.toString() + " / " + json)
            return null
        }
    }

    fun logEntryToJson(logEntry: LogEntry): String? {
        try {
            val vTree = JSONObject()

            vTree.put("author", logEntry.lid)
            vTree.put("sequence", logEntry.lsq)
            vTree.put("previous", logEntry.pre ?: JSONObject.NULL)
            // Assuming signature is present in the raw field
            vTree.put("signature", String(logEntry.raw) + ".sig.ed25519")
            vTree.put("timestamp", logEntry.tst)

            var content: JSONObject? = null
            if (logEntry.pub != null) {
                content = JSONObject(logEntry.pub)
            }
            // Assuming private content should be included when public content is not present
            else if (logEntry.pri != null) {
                content = JSONObject(logEntry.pri)
            }

            vTree.put("content", content ?: JSONObject.NULL)

            val eTree = JSONObject()
            eTree.put("key", logEntry.hid)
            eTree.put("value", vTree)

            val json = eTree.toString()
            val msg = Json_PP().makePretty(json)

            return msg
        } catch (e: Exception) {
            Log.d("LOGENTRY NOT CONVERTED", e.toString() + " / " + logEntry.toString())
            return null
        }
    }
}