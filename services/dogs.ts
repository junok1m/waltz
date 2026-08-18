import { supabase } from "../lib/supabase";
import { Dog } from "../types/dog";

export async function fetchDogsForUser(userId: string): Promise<Dog[]> {
  const { data, error } = await supabase.from("dogs").select("*").eq("owner_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createDog(input: { ownerId:string; name:string; birthYear:number; birthMonth?:number|null; birthDay?:number|null; breed?:string|null }) {
  const { data, error } = await supabase.from("dogs").insert({ owner_id:input.ownerId,name:input.name.trim(),birth_year:input.birthYear,birth_month:input.birthMonth??null,birth_day:input.birthDay??null,breed:input.breed?.trim()||null }).select("*").single();
  if (error) throw error;
  return data as Dog;
}

export async function updateDog(dogId:string,input:{name:string;breed?:string|null;avatarUrl?:string|null}) {
  const values:any={name:input.name.trim(),breed:input.breed?.trim()||null};
  if(input.avatarUrl!==undefined) values.avatar_url=input.avatarUrl;
  const {data,error}=await supabase.from("dogs").update(values).eq("id",dogId).select("*").single();
  if(error) throw error;
  return data as Dog;
}

export async function deleteDog(dogId:string) {
  const { error } = await supabase.from("dogs").delete().eq("id", dogId);
  if (error) throw error;
}

export async function uploadDogAvatar(userId:string,dogId:string,uri:string) {
  const response=await fetch(uri);
  const blob=await response.blob();
  const ext=(uri.split(".").pop()?.split("?")[0]||"jpg").toLowerCase();
  const path=`${userId}/${dogId}/${Date.now()}.${ext}`;
  const {error}=await supabase.storage.from("dog-avatars").upload(path,blob,{contentType:blob.type||`image/${ext}`,upsert:false});
  if(error) throw error;
  const {data}=supabase.storage.from("dog-avatars").getPublicUrl(path);
  return data.publicUrl;
}
