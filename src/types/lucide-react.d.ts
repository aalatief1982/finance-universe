
declare module 'lucide-react' {
  import * as React from 'react';

  export interface IconProps extends React.SVGAttributes<SVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type Icon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

  // Common icons used in the project
  export const ArrowUpCircle: Icon;
  export const ArrowDownCircle: Icon;
  export const TrendingUp: Icon;
  export const TrendingDown: Icon;
  export const PieChart: Icon;
  export const List: Icon;
  export const MessageSquare: Icon;
  export const BarChart3: Icon;
  export const BarChart: Icon;
  export const BrainCircuit: Icon;
  export const School: Icon;
  export const Loader2: Icon;
  export const ZapIcon: Icon;
  export const Globe: Icon;
  export const Building: Icon;
  export const ArrowRightLeft: Icon;
  export const Shield: Icon;
  export const Loader: Icon;
  export const Brain: Icon;
  export const PiggyBank: Icon;
  export const CheckCircle2: Icon;
  export const FolderOpen: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const AlertTriangle: Icon;
  export const Calendar: Icon;
  export const Tag: Icon;
  export const Home: Icon;
  export const Settings: Icon;
  export const User: Icon;
  export const Menu: Icon;
  export const X: Icon;
  export const LogOut: Icon;
  export const LineChart: Icon;
  export const Upload: Icon;
  export const Check: Icon;
  export const Edit: Icon;
  export const DollarSign: Icon;
  export const RefreshCw: Icon;
  export const Plus: Icon;
  export const MessageSquare: Icon;
  export const ArrowRight: Icon;
  export const Pencil: Icon;
  export const Info: Icon;
  export const ArrowUpLeft: Icon;
  export const ArrowUpRight: Icon;
  export const ArrowDownLeft: Icon;
  export const ArrowDownRight: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Clock: Icon;
  export const Filter: Icon;
  export const FileText: Icon;
  export const CreditCard: Icon;
  export const Trash: Icon;
  export const Trash2: Icon;
  export const Wallet: Icon;
  export const Users: Icon;
  export const Search: Icon;
  export const ChevronsUpDown: Icon;
  export const ChevronsLeft: Icon;
  export const ChevronsRight: Icon;
  export const EyeOff: Icon;
  export const Eye: Icon;
}
