import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BrandGuidelines: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Xpensia Brand Guidelines</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive guidelines for maintaining brand consistency across all touchpoints.
        </p>
      </div>

      {/* Logo Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Usage</CardTitle>
          <CardDescription>
            Guidelines for proper logo implementation and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Primary Logo</h4>
              <div className="p-4 border rounded-lg bg-background">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">X</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use on light backgrounds with minimum 16px clear space
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Logo with Text</h4>
              <div className="p-4 border rounded-lg bg-background">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">X</span>
                  </div>
                  <span className="text-xl font-semibold">Xpensia</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use when more brand recognition is needed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Official brand colors and their proper usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="h-16 w-full bg-primary rounded-lg"></div>
              <div>
                <p className="font-semibold text-sm">Primary</p>
                <p className="text-xs text-muted-foreground">hsl(183, 100%, 32%)</p>
                <Badge variant="outline">#0097a0</Badge>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="h-16 w-full bg-secondary rounded-lg"></div>
              <div>
                <p className="font-semibold text-sm">Secondary</p>
                <p className="text-xs text-muted-foreground">hsl(18, 100%, 62%)</p>
                <Badge variant="outline">#FF6B3C</Badge>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="h-16 w-full bg-accent rounded-lg"></div>
              <div>
                <p className="font-semibold text-sm">Accent</p>
                <p className="text-xs text-muted-foreground">hsl(18, 100%, 62%)</p>
                <Badge variant="outline">#FF6B3C</Badge>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="h-16 w-full bg-muted rounded-lg border"></div>
              <div>
                <p className="font-semibold text-sm">Muted</p>
                <p className="text-xs text-muted-foreground">hsl(217.9, 10.6%, 92%)</p>
                <Badge variant="outline">#F1F5F9</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Font hierarchy and usage guidelines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Heading 1 - Bold, 48px</h1>
              <p className="text-sm text-muted-foreground">Used for main page titles</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Heading 2 - Semibold, 32px</h2>
              <p className="text-sm text-muted-foreground">Used for section headers</p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Heading 3 - Medium, 24px</h3>
              <p className="text-sm text-muted-foreground">Used for subsection headers</p>
            </div>
            <div>
              <p className="text-base">Body Text - Regular, 16px</p>
              <p className="text-sm text-muted-foreground">Used for main content and descriptions</p>
            </div>
            <div>
              <p className="text-sm">Small Text - Regular, 14px</p>
              <p className="text-sm text-muted-foreground">Used for captions and metadata</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Tone */}
      <Card>
        <CardHeader>
          <CardTitle>Voice & Tone Guidelines</CardTitle>
          <CardDescription>
            How Xpensia communicates with users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Do</h4>
              <ul className="space-y-2 text-sm">
                <li>• Be clear and concise</li>
                <li>• Use friendly, professional language</li>
                <li>• Focus on benefits to the user</li>
                <li>• Provide helpful guidance</li>
                <li>• Use active voice</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600">Don't</h4>
              <ul className="space-y-2 text-sm">
                <li>• Use jargon or technical terms</li>
                <li>• Be overly casual or informal</li>
                <li>• Make assumptions about user knowledge</li>
                <li>• Use negative or discouraging language</li>
                <li>• Be verbose or wordy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandGuidelines;