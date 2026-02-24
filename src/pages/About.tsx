/**
 * @file About.tsx
 * @description Page component for About.
 *
 * @module pages/About
 */

import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./About.css";

const About = () => {
  return (
    <Layout showBack withPadding={false}>
      <div className="aboutPageContent">
        <header className="aboutPageHeader space-y-3">
          <p className="aboutPageLabel text-sm font-semibold uppercase tracking-[0.2em]">
            About Xpensia
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Smarter money tracking, made simple.</h1>
          <p className="text-muted-foreground max-w-2xl">
            Xpensia is a personal finance companion that helps you understand where your money goes,
            build better habits, and stay on top of your daily spending without the clutter.
          </p>
        </header>

        <section className="aboutPageSectionGrid">
          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>What you can do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="aboutPageList space-y-2 text-sm text-muted-foreground">
                <li>Track expenses and income in a clean, searchable ledger.</li>
                <li>Visualize trends with analytics and category insights.</li>
                <li>Set budgets, monitor progress, and adjust spending quickly.</li>
                <li>Import transactions from SMS or pasted statements in seconds.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="aboutPageList space-y-2 text-sm text-muted-foreground">
                <li>Organize transactions automatically with smart parsing tools.</li>
                <li>Review, edit, and categorize entries in one streamlined workflow.</li>
                <li>See your cash flow at a glance with dashboards and reports.</li>
                <li>Use exchange rate tools to keep multi-currency data accurate.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>Privacy & data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your financial data stays within the app experience. You decide what gets imported,
                what is categorized, and when adjustments are made. We focus on clarity and control
                so you feel confident reviewing every transaction.
              </p>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Need help or want to share feedback? Reach out anytime at
                <span className="font-medium text-foreground"> support@xpensia.app</span> and we will
                respond with guidance, troubleshooting steps, or feature updates.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default About;
