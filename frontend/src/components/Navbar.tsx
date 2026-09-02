import { Plus, Wallet } from 'lucide-react';

interface NavbarProps {
  onNewExpense: () => void;
}

export default function Navbar({ onNewExpense }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Reforma Chácara</h1>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gestão Financeira
            </span>
          </div>
        </div>
        
        <button 
          onClick={onNewExpense}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Nova Despesa
        </button>
      </div>
    </header>
  );
}
