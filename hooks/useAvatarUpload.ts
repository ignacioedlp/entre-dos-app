import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  apiGetAvatarUploadUrl,
  apiUpdateAvatarUrl,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

async function compressAndUpload(localUri: string) {
  // Resize to 400x400 JPEG at 80% quality
  const manipulated = await manipulateAsync(
    localUri,
    [{ resize: { width: 400, height: 400 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );

  // Get presigned URL from backend
  const { uploadUrl, publicUrl } = await apiGetAvatarUploadUrl();

  // Upload directly to R2 via XHR (reliable in React Native)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("R2 upload network error"));
    xhr.send({ uri: manipulated.uri, type: "image/jpeg", name: "avatar.jpg" } as any);
  });

  // Update profile with new avatar URL
  const profile = await apiUpdateAvatarUrl(publicUrl);
  return profile;
}

export function useAvatarUpload() {
  const { updateProfile } = useAuth();

  const mutation = useMutation({
    mutationFn: compressAndUpload,
    onSuccess: (profile) => {
      updateProfile(profile);
    },
    onError: (error) => {
      console.error("Avatar upload error:", error);
    },
  });

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      mutation.mutate(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      mutation.mutate(result.assets[0].uri);
    }
  }

  return {
    pickFromGallery,
    pickFromCamera,
    isPending: mutation.isPending,
  };
}
