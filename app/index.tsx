import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!user.coupleId) return <Redirect href="/(auth)/link" />;
  return <Redirect href="/(app)/" />;
}
