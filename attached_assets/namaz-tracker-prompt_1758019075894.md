# Islamic Prayer Tracker Web App - Development Prompt

## Project Overview
Create a modern, responsive web application for tracking daily Islamic prayers (Namaz) with analytics, achievements, and beautiful UI/UX design.

## Core Functionality

### Prayer Tracking System
- Track 5 daily prayers: Fajr, Dhuhr (Zohar), Asr, Maghrib, and Isha
- Calculate total prayers for week, month, and year (5 prayers × 7 days = 35 prayers per week)
- Distinguish between prayers completed on-time vs. missed prayers (Qaza)
- Allow users to mark prayers as completed, which automatically updates counters
- Maintain running count of remaining prayers for current week/month/year

### Three Main Pages

#### 1. Dashboard Page
- **Daily Prayer Tracker**: Interactive interface to mark today's prayers as completed
- **Week Progress Graph**: Visual representation showing completed vs. remaining prayers for current week
- **Quick Stats**: Display current week's prayer completion percentage
- **Qaza Counter**: Show total missed prayers that need to be made up
- **Weekly Goal Indicator**: Progress bar or circular progress showing week completion status

#### 2. Achievements Page
- **Achievement Cards**: Beautiful cards displaying when user completes all prayers in a week
- **Card Details Include**:
  - Exact date of achievement
  - Week number and month
  - Year
  - Breakdown: On-time prayers vs. Qaza prayers completed
  - Celebratory design with Islamic patterns or calligraphy
- **Achievement Timeline**: Chronological display of all achievements
- **Streak Counter**: Show current and best streak of complete weeks

#### 3. Analytics Page
- **Multi-timeframe Graphs**:
  - Weekly view: Completed vs. missed prayers by day
  - Monthly view: Prayer completion trends over weeks
  - Yearly view: Monthly completion percentages
- **Prayer-specific Analytics**: Individual graphs for each of the 5 prayers
- **Achievement Timeline Graph**: Visual timeline showing when achievements were earned
- **Statistics Summary**:
  - Total prayers completed
  - On-time vs. Qaza ratio
  - Most/least consistent prayer times
  - Monthly averages

## Design Requirements

### Visual Design
- **Modern UI/UX**: Clean, intuitive interface with smooth animations
- **Dark/Light Mode**: Seamless toggle between themes with proper color schemes
- **Liquid Glass Effects**: Implement glassmorphism/liquid glass effects on cards, modals, and key UI elements
- **Islamic Aesthetic**: Subtle Islamic geometric patterns or calligraphy elements
- **Responsive Design**: Mobile-first approach, works perfectly on all screen sizes

### User Experience
- **Interactive Elements**: Smooth hover effects, satisfying click animations
- **Progress Visualizations**: Engaging progress bars, circular progress indicators
- **Color Psychology**: Use calming, spiritual colors (greens, blues, golds)
- **Accessibility**: Proper contrast ratios, keyboard navigation, screen reader support

### Technical Specifications
- **Frontend Framework**: Use modern JavaScript framework (React, Vue, or vanilla JS with modern features)
- **Charts/Graphs**: Interactive charts using Chart.js, D3.js, or similar library
- **Data Storage**: Local storage or IndexedDB for offline functionality
- **Animations**: CSS animations and transitions for smooth interactions
- **Icons**: Islamic/prayer-themed icons and symbols

## Key Features

### Smart Calculations
- Automatically calculate prayer requirements based on Islamic calendar
- Handle different time zones and prayer time variations
- Account for travel days or special circumstances
- Weekly/monthly/yearly prayer totals with accurate counting

### Achievement System
- Unlock achievements for completing prayer goals
- Special recognition for maintaining streaks
- Visual celebration when weekly goals are met
- Motivational elements to encourage consistency

### Data Persistence
- Save all prayer data locally
- Export/import functionality for backup
- Historical data preservation
- Offline functionality

## Implementation Guidelines

### Performance
- Fast loading times with optimized assets
- Smooth animations at 60fps
- Efficient data storage and retrieval
- Lazy loading for better performance

### Code Quality
- Clean, maintainable code structure
- Proper error handling
- Cross-browser compatibility
- Security best practices for data handling

### User Interface Elements
- **Navigation**: Clean tab-based or sidebar navigation
- **Buttons**: Modern, responsive buttons with hover effects
- **Cards**: Glassmorphism cards with subtle shadows and blur effects
- **Forms**: Intuitive prayer marking interface
- **Graphs**: Interactive, colorful charts with smooth transitions

## Success Criteria
- Intuitive prayer tracking that takes less than 10 seconds daily
- Beautiful, engaging visual design that motivates regular use
- Accurate calculations and data persistence
- Smooth performance across all devices
- Meaningful analytics that help users understand their prayer habits
- Achievement system that celebrates spiritual consistency

## Additional Considerations
- Include brief Islamic context/motivation for prayer consistency
- Consider prayer time reminders (if requested)
- Implement gentle motivational messages
- Ensure cultural sensitivity in design and messaging
- Make the app feel like a spiritual companion, not just a tracker

Please create a fully functional web application following these specifications, paying special attention to the beautiful UI design with liquid glass effects, comprehensive analytics, and meaningful achievement system.