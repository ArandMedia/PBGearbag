import { Platform } from 'react-native';

// React Native's { uri, name, type } FormData shape only works on iOS/Android
// — their native networking layer resolves the uri to real file bytes. On
// web that object has no binary content at all, so the multipart request
// arrives with an empty file part and the backend rejects it as "No file
// uploaded". On web we have to fetch the blob: URI ourselves first.
export async function toUploadPart(uri: string, name: string, type: string): Promise<any> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return new File([blob], name, { type });
  }
  return { uri, name, type } as any;
}
