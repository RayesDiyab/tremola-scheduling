package nz.scuttlebutt.tremola.ssb.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
data class Event(
    @PrimaryKey(autoGenerate = true) val id: Int,
    val name: String,
    val date: String,
    val time: String,
    val author: String, // Add a new field for the author's name or ID
    val description: String,
    // Add any additional columns here...
)
