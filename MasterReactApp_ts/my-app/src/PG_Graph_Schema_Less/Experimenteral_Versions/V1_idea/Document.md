Solution: 

Add Win Map for Add Win Operations - BUT properties of nodes are LWW :C

Remove Win Map for Remove Win Operations - filter out deleted nodes based on tombstone map in getVisibleNodes 
but keep properties as LWW for updates on deleted nodes (revival possible but more storage needed for tombstone properties)