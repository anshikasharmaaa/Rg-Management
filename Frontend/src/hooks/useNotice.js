import { useState, useEffect } from "react";

// Success message that clears itself.
const useNotice = (ms = 3000) => {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), ms);
    return () => clearTimeout(timer);
  }, [notice, ms]);

  return [notice, setNotice];
};

export default useNotice;
