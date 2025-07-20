
declare module 'recharts' {
  export interface ChartProps {
    width?: number;
    height?: number;
    data?: any[];
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    children?: React.ReactNode;
    layout?: 'horizontal' | 'vertical';
  }

  export function ResponsiveContainer(props: {
    width?: number | string;
    height?: number | string;
    children: React.ReactNode;
  }): JSX.Element;
  
  export function BarChart(props: ChartProps): JSX.Element;
  export function LineChart(props: ChartProps): JSX.Element;
  export function PieChart(props: ChartProps): JSX.Element;
  
  export function Bar(props: {
    dataKey: string;
    fill?: string;
    stroke?: string;
    stackId?: string;
    [key: string]: any;
  }): JSX.Element;
  
  export function Line(props: {
    type?: string;
    dataKey: string;
    stroke?: string;
    activeDot?: any;
    [key: string]: any;
  }): JSX.Element;
  
  export function Pie(props: {
    data?: any[];
    dataKey: string;
    nameKey?: string;
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number;
    outerRadius?: number;
    [key: string]: any;
  }): JSX.Element;
  
  export function XAxis(props: { dataKey?: string; [key: string]: any }): JSX.Element;
  export function YAxis(props: { [key: string]: any }): JSX.Element;
  export function CartesianGrid(props: { [key: string]: any }): JSX.Element;
  export function Tooltip(props: { [key: string]: any }): JSX.Element;
  export function Legend(props: { [key: string]: any }): JSX.Element;
  export function Cell(props: { fill?: string; [key: string]: any }): JSX.Element;
}
