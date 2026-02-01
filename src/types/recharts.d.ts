/**
 * @file recharts.d.ts
 * @description Type definitions for recharts.d.
 *
 * @module types/recharts.d
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

declare module 'recharts' {
  export interface ChartProps {
    width?: number;
    height?: number;
    data?: Record<string, unknown>[];
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    children?: React.ReactNode;
    layout?: 'horizontal' | 'vertical';
  }

  export interface CategoricalChartState {
    isTooltipActive?: boolean;
    activeTooltipIndex?: number;
    activeLabel?: string | number;
    activePayload?: unknown[];
    activeCoordinate?: { x: number; y: number };
  }

  export type ActiveShape<Props = Record<string, unknown>> =
    | React.ReactElement
    | ((props: Props) => React.ReactElement);

  export interface PieLabelRenderProps {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    percent: number;
  }

  export interface TooltipProps<TValue = number, TName = string> {
    active?: boolean;
    payload?: Array<{
      value?: TValue;
      name?: TName;
      payload?: Record<string, unknown>;
      color?: string;
    }>;
    label?: string | number;
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
    [key: string]: unknown;
  }): JSX.Element;
  
  export function Line(props: {
    type?: string;
    dataKey: string;
    stroke?: string;
    activeDot?: ActiveShape;
    [key: string]: unknown;
  }): JSX.Element;
  
  export function Pie(props: {
    data?: Record<string, unknown>[];
    dataKey: string;
    nameKey?: string;
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number;
    outerRadius?: number;
    [key: string]: unknown;
  }): JSX.Element;
  
  export function XAxis(props: { dataKey?: string; [key: string]: unknown }): JSX.Element;
  export function YAxis(props: { [key: string]: unknown }): JSX.Element;
  export function CartesianGrid(props: { [key: string]: unknown }): JSX.Element;
  export function Tooltip(props: { [key: string]: unknown }): JSX.Element;
  export function Legend(props: { [key: string]: unknown }): JSX.Element;
  export function Cell(props: { fill?: string; [key: string]: unknown }): JSX.Element;
}
