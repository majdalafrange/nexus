import React from "react";

export function Stopwatch(){
  const [ms, setMs] = React.useState(0);
  const ref = React.useRef<{start:()=>void, stop:()=>void} | null>(null);

  React.useEffect(() => {
    let timer: any;
    let startAt = 0;
    ref.current = {
      start(){
        setMs(0);
        startAt = performance.now();
        clearInterval(timer);
        timer = setInterval(() => setMs(performance.now() - startAt), 50);
      },
      stop(){
        clearInterval(timer);
      }
    };
    (window as any).__ROX_STOPWATCH = ref.current;
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pill">{(ms/1000).toFixed(1)}s</div>
  )
}
