import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import {TooltipProvider} from "@/components/ui/tooltip";
const geist = Geist({subsets:['latin'],variable:'--font-sans'});



export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
