import {storageClient} from '../supabase/server';
export class PrivateStorage{
 private bucket(){return storageClient().storage.from(process.env.SUPABASE_STORAGE_BUCKET||'tj-sons-files');}
 async put(id:string,bytes:Uint8Array,options?:{httpMetadata?:{contentType?:string}}){
  const {error}=await this.bucket().upload(id,bytes,{upsert:true,contentType:options?.httpMetadata?.contentType||'application/octet-stream',cacheControl:'0'});
  if(error)throw new Error('File upload failed. Check the private Supabase storage bucket.');
 }
 async get(id:string){const {data,error}=await this.bucket().download(id);if(error){if(String((error as any).statusCode)==='404'||/not found/i.test(error.message))return null;throw new Error('File download failed.');}return {body:data.stream()};}
 async delete(id:string){const {error}=await this.bucket().remove([id]);if(error)throw new Error('File cleanup failed.');}
}
