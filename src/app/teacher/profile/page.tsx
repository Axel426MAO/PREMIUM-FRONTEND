// src/app/admin/profile/page.tsx (ou onde sua página estiver)
"use client";

import { UserProfileCard } from "@/app/shared/sections/UserProfileCard";
import { useUserStore } from "@/app/store/userStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
export default function ProfilePage() {
  const { user } = useUserStore();
  const router = useRouter();

  // Exibe um estado de carregamento se os dados do usuário ainda não estiverem disponíveis
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <p>Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-8">
          <Button
        variant="outline"
        size="icon"
        onClick={() => router.back()}
        className="shrink-0 h-10 w-10 mb-2"
      >
        <ArrowLeft className="h-5 w-5" />
        
      </Button>
      
      {/* Renderiza o componente reutilizável, passando o usuário do store */}
      <UserProfileCard user={user} />

    </main>
  );
}