'use client';
import {useEffect,useState,useRef} from 'react';
import {useFormState,useFormStatus} from 'react-dom';
type Result={error?:string;success?:string};
function Submit({label,ready}:{label:string;ready:boolean}){const {pending}=useFormStatus();return <button disabled={pending||!ready} className="rounded-xl bg-[#07527f] px-5 py-3 text-base font-bold text-white disabled:opacity-50">{pending?'Saving…':label}</button>;}
export default function ActionForm({action,children,label,className='space-y-5'}:{action:(state:Result,form:FormData)=>Promise<Result>;children:React.ReactNode;label:string;className?:string}){
 const [state,dispatch]=useFormState(action,{}),[key,setKey]=useState('');const ref=useRef<HTMLFormElement>(null);useEffect(()=>setKey(crypto.randomUUID()),[]);useEffect(()=>{if(state.success){ref.current?.reset();setKey(crypto.randomUUID());}},[state]);
 return <form ref={ref} action={dispatch} className={className}><input type="hidden" name="requestKey" value={key}/>{state.error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-base text-rose-800">{state.error}</div>}{state.success&&<div role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{state.success}</div>}{children}<Submit label={label} ready={!!key}/></form>;
}
