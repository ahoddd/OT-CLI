/**
 * Tutorial definitions for guided onboarding and Settings replay.
 * Each tutorial has an id (matches screen/feature), title, short description, and steps.
 */

export interface TutorialStep {
  title: string;
  body: string;
}

export interface TutorialDef {
  id: string;
  title: string;
  shortDescription: string;
  steps: TutorialStep[];
}

export const TUTORIALS: TutorialDef[] = [
  {
    id: 'map',
    title: 'Discover & Earn OT Points',
    shortDescription: 'Learn how to find partners and earn on your first visit',
    steps: [
      {
        title: 'Tap any glowing orb pin',
        body: 'Each orb is a local partner with perks you can earn OT Points at. Tap any pin to see what\'s available near you.',
      },
      {
        title: 'Follow to stay connected',
        body: 'Tap Follow on any partner to get updates on new perks and drops. Your followed partners appear in your hub.',
      },
      {
        title: 'Scan at the venue',
        body: 'Tap Redeem, then show the QR code at the counter. The partner scans it — you earn OT Points instantly.',
      },
      {
        title: 'Collect your Proof Card',
        body: 'Every verified visit creates a Proof Card with your points earned. Share it to flex your win and invite friends.',
      },
    ],
  },
  {
    id: 'orb',
    title: 'Orb Hub & Daily Ritual',
    shortDescription: 'Your command center, points, and daily orb.',
    steps: [
      { title: 'Orb Hub', body: 'This is your command center. Your OT Points are shown here. Use Quick Actions to jump to Commerce Feed, Pulse, People, and more.' },
      { title: 'Daily Ritual', body: 'Tap the orb to do your daily ritual and build your streak. Completing it each day keeps your momentum and can unlock rewards.' },
      { title: 'Spheres', body: 'Scroll down to join Spheres—invite-only groups where you can pool points and share experiences with friends or family.' },
    ],
  },
  {
    id: 'feed',
    title: 'Commerce Feed',
    shortDescription: 'Partner posts, drops, and deals.',
    steps: [
      { title: 'What is the Commerce Feed?', body: 'Partners post drops, menu updates, events, and announcements here. Filter by Nearby, Tonight, Drops, New, Services, or Deals.' },
      { title: 'Color-coded posts', body: 'Each post has a colored label (e.g. Drop, Menu, Event). Tap a post to see details, reserve, or claim—and share with friends.' },
    ],
  },
  {
    id: 'pulse',
    title: 'OrbPulse Live',
    shortDescription: 'Proof-based momentum and trending.',
    steps: [
      { title: 'OrbPulse Live', body: 'See what\'s trending right now—partners and drops ranked by real proof (verifications, claims), not likes. Filter by All, Partners, Drops, Tonight, or New.' },
      { title: 'Tap to explore', body: 'Tap any tile to open the partner or drop. Use search to find specific businesses or members.' },
    ],
  },
  {
    id: 'people',
    title: 'People & Friends',
    shortDescription: 'Friends, requests, and connections.',
    steps: [
      { title: 'People', body: 'Add friends by user ID and see pending requests. Your friends can appear in leaderboards and Spheres.' },
      { title: 'Search', body: 'Use the search icon to find members or businesses across the app.' },
    ],
  },
  {
    id: 'spheres',
    title: 'Spheres',
    shortDescription: 'Invite-only groups and pooled points.',
    steps: [
      { title: 'What are Spheres?', body: 'Spheres are invite-only groups—with friends, family, or your squad. Create one or join one with an invite link.' },
      { title: 'Pool & share', body: 'Pool OT Points with your Sphere to unlock rewards together and share real-world experiences.' },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    shortDescription: 'Find partners, members, and more.',
    steps: [
      { title: 'Search the app', body: 'Use the search icon (magnifying glass) in the header on the map, feed, Pulse, or Orb page.' },
      { title: 'Scopes', body: 'Choose to search the Map, All, Businesses, or Members. Results let you open a partner page or the People page.' },
    ],
  },
  {
    id: 'opportunities',
    title: 'Opportunities',
    shortDescription: 'Apply to partner opportunities.',
    steps: [
      { title: 'Opportunities', body: 'Browse and apply to opportunities posted by partners—jobs, gigs, or special programs. Track your applications in My Applications.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    shortDescription: 'Theme, security, and tutorials.',
    steps: [
      { title: 'Settings', body: 'Change theme (light/dark/system), enable Face ID or fingerprint sign-in, and manage share message and partner mode.' },
      { title: 'Tutorials', body: 'Come back here anytime to replay tutorials for any feature. Tap Tutorials in Settings to see the full list.' },
    ],
  },
  {
    id: 'partner_dashboard',
    title: 'Partner Dashboard',
    shortDescription: 'Your business hub and Stamp Studio.',
    steps: [
      { title: 'Partner Dashboard', body: 'Here you can see your partner metrics, upgrade options, and quick links. Use Stamp Studio to create and manage stamp cards for your business.' },
      { title: 'Stamp Cards', body: 'Display the Stamp Studio QR at your counter so customers can scan and earn stamps. Stamp Cards help drive repeat visits and verified reviews.' },
    ],
  },
  {
    id: 'partner_stamp_studio',
    title: 'Stamp Studio',
    shortDescription: 'Create and manage stamp programs.',
    steps: [
      { title: 'Stamp Studio', body: 'Create stamp programs, set rewards, and get a QR code to display at your venue. Customers scan with the OrbTap app to add stamps.' },
      { title: 'Display at your venue', body: 'Save or share the QR code and display it at your counter. When customers scan it, they earn a stamp toward the reward you set.' },
    ],
  },
];

export function getTutorialById(id: string): TutorialDef | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
