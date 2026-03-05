import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD1FhXnu124OGrqKH8HqHQgIvmGsbEMa9U",
  authDomain: "lid-publishing-helper.firebaseapp.com",
  projectId: "lid-publishing-helper",
  storageBucket: "lid-publishing-helper.firebasestorage.app",
  messagingSenderId: "273413128584",
  appId: "1:273413128584:web:774490a0cb720e8674fa3d"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
