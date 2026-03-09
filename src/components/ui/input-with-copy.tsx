import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InputWithCopyProps extends React.ComponentProps<typeof Input> {
  onCopy?: () => void;
}

export function InputWithCopy({ className, onCopy, ...props }: InputWithCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.value) {
      navigator.clipboard.writeText(props.value.toString());
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    }
  };

  return (
    <div className="relative">
      <Input className={cn("pr-9", className)} {...props} />
      {props.value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground hover:bg-transparent"
          onClick={handleCopy}
          tabIndex={-1}
          title="Copiar"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      )}
    </div>
  );
}
