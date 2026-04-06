'use client'
import Image from "next/image";
import { useEffect, useState } from 'react'
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/firebase.config';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<any>([]);
  
  useEffect(() => {
    fetchItems()
  }, [])
  
  const handleAdd = async () => {
    await addDoc(collection(db, 'items'), { inputText })
    setInputText('');
    fetchItems();
  }
  
  const handleDelete = async (id: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'items', id));
    fetchItems();
  }
  
  const handleEdit = async (id: string) => {
    const editValue = prompt("Enter the new value");
    if (!editValue) return;
    await updateDoc(doc(db, 'items', id), { inputText: editValue })
    fetchItems();
  }
  
  const fetchItems = async () => {
    const snapshot = await getDocs(collection(db, 'items'))
    setItems(snapshot.docs.map((doc) => ({ id: doc.id, inputText: doc.data().inputText })))
  }
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-
screen p-8 pb-20 gap-16 sm:p-20" >
      <h1>NextJS Firebase</h1>
      <input type="text" className="border-2" value={inputText} onChange={(e) =>
        setInputText(e.target.value)} />
      <button className="border p-2" onClick={handleAdd}>Agregar</button>
      <ul>
        {items.map((item: any) => <li key={item.inputText}>{item.inputText}
          <button className="p-2 border bg-yellow-500 text-white cursor-pointer"
            onClick={() => { handleEdit(item.id) }}>Edit</button>
          <button className="p-2 border bg-red-500 text-white cursor-pointer"
            onClick={() => { handleDelete(item.id) }}>Delete</button>
        </li>)}
      </ul>
    </div>
  );
}