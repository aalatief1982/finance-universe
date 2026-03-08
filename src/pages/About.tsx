import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import "./About.css";

const About = () => {
  const { t } = useLanguage();

  return (
    <Layout withPadding={false}>
      <div className="aboutPageContent">
        <header className="aboutPageHeader space-y-3">
          <p className="aboutPageLabel text-sm font-semibold uppercase tracking-[0.2em]">
            {t('about.label')}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t('about.headline')}</h1>
          <p className="text-muted-foreground max-w-2xl">
            {t('about.description')}
          </p>
        </header>

        <section className="aboutPageSectionGrid">
          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>{t('about.whatYouCanDo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="aboutPageList space-y-2 text-sm text-muted-foreground">
                <li>{t('about.whatYouCanDo.1')}</li>
                <li>{t('about.whatYouCanDo.2')}</li>
                <li>{t('about.whatYouCanDo.3')}</li>
                <li>{t('about.whatYouCanDo.4')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>{t('about.howItWorks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="aboutPageList space-y-2 text-sm text-muted-foreground">
                <li>{t('about.howItWorks.1')}</li>
                <li>{t('about.howItWorks.2')}</li>
                <li>{t('about.howItWorks.3')}</li>
                <li>{t('about.howItWorks.4')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>{t('about.privacyData')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('about.privacyDataDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="aboutPageCard">
            <CardHeader className="aboutPageCardHeader">
              <CardTitle>{t('about.support')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('about.supportDesc')}
                <span className="font-medium text-foreground"> {t('about.supportEmail')}</span> {t('about.supportSuffix')}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default About;
