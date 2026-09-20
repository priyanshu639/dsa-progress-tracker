"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export function Nav(){const [email,setEmail]=useState<string|null>(null);useEffect(()=>{supabase.auth.getUser().then(({data})=>setEmail(data.user?.email??null));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setEmail(s?.user?.email??null));return()=>data.subscription.unsubscribe()},[]);return <nav className="nav"><Link href="/" className="brand">⚡ DSA Tracker</Link><div className="navlinks">{email&&<><Link href="/dashboard">Dashboard</Link><Link href="/problems">Problems</Link><Link href="/analytics">Analytics</Link><Link href="/import">Import</Link><button className="btn" onClick={async()=>{await supabase.auth.signOut();location.href="/login"}}>Logout</button></>}{!email&&<Link href="/login" className="primary">Login</Link>}</div></nav>}
