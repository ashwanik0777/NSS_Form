import Link from "next/link"
import { Shield, Users, Award, ArrowRight, CheckCircle, Zap, Globe } from "lucide-react"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex gap-5 sm:gap-5">
                <Link href="/" className="flex items-center" aria-label="GBU Home">
                  <img
                    src="/1.png"
                    alt="GBU Logo"
                    className="h-11 w-auto sm:h-13"
                  />
                </Link>
                <Link href="/" className="flex items-center" aria-label="NSS Home">
                  <img
                    src="/nssLogo.png"
                    alt="NSS Logo"
                    className="h-10 w-auto sm:h-11"
                  />
                </Link>
                <Link href="/" className="flex items-center" aria-label="My Bharat Home">
                  <img
                    src="/myBharatLogo.png"
                    alt="My Bharat Logo"
                    className="h-11 w-auto sm:h-12"
                  />
                </Link>
              </div>
            </div>
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-2 sm:space-x-4">
              <Link
                href="/register"
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Apply Now
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 sm:px-6 sm:py-2.5 border-2 border-border text-foreground rounded-lg hover:bg-muted hover:border-primary transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
              >
                Login
              </Link>
            </nav>
            {/* Mobile Nav */}
            <nav className="md:hidden flex items-center space-x-2">
              <Link
                href="/register"
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold shadow hover:bg-primary/90 transition-all"
              >
                Apply
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 border border-border text-foreground rounded-md text-sm font-semibold hover:bg-muted hover:border-primary transition-all"
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="w-28 h-28  rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl hover-lift">
            {/* <Shield className="w-16 h-16 text-white" /> */}
            <img
              src="/nssLogo.png"
              alt="NSS Logo"
              className="h-22 w-auto"
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            National Service <span className="gradient-text">Scheme</span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-medium">राष्ट्रीय सेवा योजना -गौतम बुद्ध विश्वविद्यालय
</p>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Join the National Service Scheme and contribute to nation-building through community service. Register as a
            volunteer and make a difference in society with thousands of like-minded students.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center px-10 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              Start Registration
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center px-10 py-4 border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-primary transition-all duration-300 font-semibold text-lg hover:scale-105 active:scale-95"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Why Join NSS?</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              The National Service Scheme provides opportunities for students to participate in community service and
              develop leadership skills while contributing to national development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Community Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                Engage in meaningful community service projects that create positive impact in society and help build a
                better nation.
              </p>
            </div>

            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Leadership Development</h3>
              <p className="text-muted-foreground leading-relaxed">
                Develop leadership skills and gain valuable experience in organizing and managing projects that benefit
                communities.
              </p>
            </div>

            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Official Recognition</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive official certificates and recognition for your service to the nation from government
                authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">Active Volunteers</div>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">10+</div>
              <div className="text-muted-foreground">Projects Completed</div>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">8</div>
              <div className="text-muted-foreground">Schools</div>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">10+</div>
              <div className="text-muted-foreground">Years of Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10"></div>
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Serve the Nation?</h2>
          <p className="text-muted-foreground mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who are making a difference through the National Service Scheme. Start your
            journey today.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95"
          >
            Register Now
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
