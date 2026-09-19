"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employee/settings");
  }, [router]);

  return null;
}
