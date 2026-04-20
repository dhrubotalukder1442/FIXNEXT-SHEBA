import { useEffect } from "react";
import { useRouter } from "next/navigation"; 


useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    router.push("/login");
  } else if (user.role !== "serviceman") {
    router.push("/");
  }
}, []);