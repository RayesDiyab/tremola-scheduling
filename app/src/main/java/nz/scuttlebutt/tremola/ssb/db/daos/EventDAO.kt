package nz.scuttlebutt.tremola.ssb.db.daos

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import nz.scuttlebutt.tremola.ssb.db.entities.Event

@Dao
interface EventDAO {
    @Insert
    fun insert(event: Event)

    @Query("SELECT * FROM Event")
    fun getAll(): List<Event>

    @Query("DELETE FROM Event")
    fun deleteAll()
    // Add any additional queries here...
}
