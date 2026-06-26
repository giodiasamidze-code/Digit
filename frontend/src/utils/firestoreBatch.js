import { collection, getDocs, limit, query, writeBatch } from 'firebase/firestore'

const BATCH_SIZE = 500

export async function deleteCollectionDocuments(firestore, ...pathSegments) {
  const collectionRef = collection(firestore, ...pathSegments)

  while (true) {
    const snapshot = await getDocs(query(collectionRef, limit(BATCH_SIZE)))
    if (snapshot.empty) return

    const batch = writeBatch(firestore)
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    await batch.commit()

    if (snapshot.size < BATCH_SIZE) return
  }
}
