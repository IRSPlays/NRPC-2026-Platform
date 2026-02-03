import { Link } from 'react-router-dom';
import { Calculator, Upload, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="hex-pattern absolute inset-0 opacity-30 -z-10" />
        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          NRPC Robotics Challenge
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          De-extinction Competition 2026 - Score Calculator & Research Poster Submission Platform
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors btn-glow"
          >
            <Calculator className="w-5 h-5" />
            Score Calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/team-login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-card border-2 border-primary text-primary dark:text-primary-light rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Submit Poster
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-card rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-2">Score Calculator</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Calculate scores for all 7 missions with strict rule validation. Maximum 155 points.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-2">Poster Submission</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your research poster or submit a Canva/Google Drive link. Automated filename validation.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-2">Admin Panel</h3>
          <p className="text-gray-600 dark:text-gray-400">
            For judges and organizers. Manage teams, review submissions, and view leaderboard.
          </p>
        </div>
      </section>

      {/* Competition Info */}
      <section className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-2xl p-8 border border-primary/20">
        <h2 className="text-3xl font-heading font-bold mb-6 text-center">Competition Overview</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">Research Poster (100 points)</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Theme: De-extinction</li>
              <li>• Current technology concepts (40%)</li>
              <li>• Future innovations (30%)</li>
              <li>• Organization & clarity (20%)</li>
              <li>• Aesthetic design (10%)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">Robot Missions (155 points)</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Mission 1: Clear the way (30 pts)</li>
              <li>• Mission 2: Feeding time! (15 pts)</li>
              <li>• Mission 3: Move hay bales (30 pts)</li>
              <li>• Mission 4: Collect bones (20 pts)</li>
              <li>• Mission 5: Sanctuary Tour (30 pts)</li>
              <li>• Mission 6: Rescue (15 pts)</li>
              <li>• Mission 7: Power it up (15 pts)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}