# ClaudeCode Reset Schedule & Usage Analysis - Project Story

## About the Project

### What Inspired This Project

This project was born from three fundamental inconveniences I felt while using ClaudeCode on a daily basis:

1. **Wanting to see real-time usage status**: "I don't know how much resources I'm currently consuming..."
2. **Wanting to check how long until the limit resets**: "It's annoying not knowing when it will reset..."
3. **How many hours should I plan to consume the current resources**: "I want to create an efficient resource consumption plan!"

While I theoretically understood ClaudeCode's 5-hour reset cycle, it was difficult to calculate dynamic reset times based on actual usage patterns, grasp current usage status, and formulate strategic resource consumption plans. In particular, it was extremely challenging to accurately track the complex rules of resetting 5 hours after usage starts and starting a new cycle when there's a gap of more than 5 hours, and to create efficient work plans based on this.

### Discovery and Learning

During project development, the topic of ccusage (Claude Code Usage) emerged, which was a natural extension of this usage visualization demand. Through research, I discovered the existence of Claude session log files (JSONL format), which led to the idea of "creating a real-time analysis tool by visualizing this data."

### Technical Learning Points

- **Dynamic reset cycle implementation**: Not just simple 5-hour intervals, but dynamic cycle calculation based on actual usage patterns
- **00-minute snap function**: A mechanism to adjust reset times to 00 minutes, matching actual ClaudeCode behavior
- **Support for ClaudeCode log format**: Analysis of ClaudeCode's JSONL log format and statistical calculations
- **Real-time updates**: 1-second time updates and countdown display
- **Browser-based data persistence**: Secure local storage using IndexedDB
- **Advanced period history management**: Efficient display of large amounts of data through filtering, sorting, and pagination features
- **Current period sample data generation**: Dummy data generation feature for testing functionality when no real data is available
- **Local timezone support**: Time display adapted to the user's region

## Project Construction Process

### 1. Basic Function Implementation (Real-time Status Monitoring)
- Real-time clock display (local timezone support)
- 5-hour reset cycle countdown
- Basic UI/UX design
- **Goal achieved**: Foundation for real-time usage status confirmation

### 2. Data Analysis Function Addition (Usage Visualization)
- JSONL file parsing functionality
- Usage statistics calculation
- Model-specific cost analysis
- **Goal achieved**: Detailed understanding of current usage status

### 3. Advanced Function Implementation (Resource Consumption Planning Support)
- Dynamic reset cycle calculation
- Period-based usage history
- Plan-specific cost simulation
- Model-specific detailed analysis
- **Goal achieved**: Support for efficient resource consumption planning

### 4. UX Improvement and Accessibility Enhancement
- Enhanced file management functionality
- Multiple file support and automatic selection feature
- Error handling
- Responsive design

### 5. Design Refinement and Usability Improvement
- **Adjustment to calmer colors**: Changed from the initial colorful design to a more subdued slate-gray color scheme
- **Header improvements**: Added badges showing privacy protection, browser-based processing, and real-time analysis features
- **Sample data function addition**: Sample JSONL file download functionality so users can try features without their own log files
- **Enhanced multilingual support**: Complete English-Japanese support and localization

### 6. Usability Improvement and Advanced Feature Addition
- **Sample data provision**: Sample files with 3 different session patterns
  - Todo list development session (Claude 4 Sonnet-focused)
  - Data analysis project session (Claude 4 Opus-focused)
  - Current period sample (real data or dummy data)
- **Advanced period history management**: Filtering, sorting, and pagination features
- **Enhanced file management**: Selected file deletion, all file clearing, and automatic new file selection features
- **Current period detailed display**: Real-time display of ongoing period usage status

### 7. Privacy Protection and Local Processing Enhancement
- **Complete browser-based processing**: All calculations and data processing executed within the browser
- **No external transmission**: Design where data is not sent to external servers
- **Local timezone support**: Time display adapted to user's regional settings
- **Bolt.new badge**: Clear indication of development platform

## Challenges Faced and Solutions

### 1. Complex Reset Logic
**Challenge**: To accurately reproduce ClaudeCode's actual behavior, we needed to implement the following complex rules:
- 00-minute snap based on the "hour" of first usage time
- New cycle start with intervals of 5 hours or more
- Dynamic reference time calculation

**Solution**: Detailed analysis of actual log data and gradual improvement of time calculation algorithms. Created test cases to verify behavior.

### 2. Support for ClaudeCode Log Format
**Challenge**: 
- Complex structure of Claude session logs
- Data normalization and integration
- Accurate extraction of token usage

**Solution**: Implemented parsers supporting multiple log formats and enhanced error handling. Created sample data to establish test environment.

### 3. Performance Optimization
**Challenge**:
- Efficient processing of large amounts of log data
- Real-time update optimization
- Memory usage management

**Solution**: Data processing optimization, reduction of unnecessary recalculations, adoption of efficient data structures. Optimized large data display through pagination functionality in period history.

### 4. Accurate Cost Calculation
**Challenge**:
- Implementation of model-specific pricing systems (updated to 2025 standards)
- Individual calculation of input/output tokens
- Improved accuracy of plan-specific simulations

**Solution**: Implementation of calculation logic reflecting latest pricing information, support for cache functionality in cost calculations.

### 5. Design and Usability Improvements
**Challenge**:
- Initial design was "too colorful and hard to see"
- Header was too dark, "like a funeral"
- New users couldn't try features without data

**Solution**:
- Unified to calm slate-gray color scheme
- Added badges for privacy protection, browser-based processing, and real-time analysis to header
- Added sample data download functionality (including current period samples)
- Enhanced multilingual support and localization

### 6. Large Data Management and Display
**Challenge**:
- Large amounts of period data from long-term usage history
- Efficient data filtering and sorting
- Display methods that don't compromise usability

**Solution**:
- Implemented filtering functionality in period history (date range, minimum request count, minimum cost)
- Added sorting functionality (date/time, request count, cost, token count)
- Improved display performance through pagination functionality

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Icons**: Lucide React
- **Data Storage**: IndexedDB (browser-based persistence)
- **Build Tool**: Vite
- **Development Environment**: WebContainer (Bolt.new)
- **Internationalization**: Custom multilingual support system

## Current Major Features

### 1. Real-time Reset Schedule
- Local timezone clock display
- Dynamic 5-hour cycle calculation
- Countdown to next reset
- 00-minute snap functionality
- **Goal achieved**: Accurate understanding of reset times

### 2. Detailed Usage Analysis
- Detailed token usage breakdown (input/output/cache)
- Model-specific usage statistics
- Hourly usage distribution
- Cost calculation (by input/output/cache write/read)
- **Goal achieved**: Real-time usage status confirmation

### 3. Plan-specific Cost Simulation
- Estimated cost with pay-as-you-go pricing
- Savings calculation with $200 plan
- Simulation with 4x token usage
- Monthly usage estimation
- **Goal achieved**: Efficient resource consumption planning

### 4. Period-based History Display (Advanced Management Features)
- Usage history for each 5-hour period
- Detailed current period display
- Visualization with cost weighting
- Model-specific detailed analysis
- Filtering functionality (date range, minimum request count, minimum cost)
- Sorting functionality (date/time, request count, cost, token count)
- Pagination functionality (10/20/50/100 items display switching)

### 5. File Management System
- Multiple JSONL file management
- File selection functionality (automatic new file selection)
- Persistent storage with IndexedDB
- Sample data download functionality (3 types)
- Selected file deletion functionality
- All files clear functionality

### 6. Multilingual Support
- Complete English-Japanese support
- Dynamic language switching
- Localization support

### 7. Privacy Protection Features
- Complete browser-based processing
- No external data transmission
- Local timezone support
- Secure local storage

## Project Value and Results

### 1. Improved Transparency
By visualizing reset times, users can easily plan their usage and achieve efficient ClaudeCode utilization. **Completely achieved the initial goal of "wanting to check how long until the limit resets."**

### 2. Usage Understanding
Detailed statistics enable accurate understanding of current usage status and easier cost management. **Completely achieved the initial goal of "wanting to see real-time usage status."**

### 3. Cost Optimization
Plan-specific simulations enable selection of optimal pricing plans and improved cost efficiency. **Completely achieved the initial goal of "how many hours should I plan to consume the current resources."**

### 4. Usage Pattern Analysis
Analysis of hourly distribution and model-specific usage enables optimization of usage habits.

### 5. Privacy Protection
All processing is completed within the browser and data is not transmitted externally, protecting privacy.

### 6. Improved Accessibility
The sample data functionality (including current period samples) allows new users to easily try features, significantly lowering the barrier to adoption.

### 7. Efficient Management of Large Data
Filtering, sorting, and pagination features enable efficient management and analysis of long-term usage history.

## Design Evolution

### Initial Design
- Colorful scheme (bright blue, purple, green colors)
- Visually impactful but criticized as "hard to see"

### Intermediate Design
- Adjusted to calmer colors
- However, header was too dark and criticized as "like a funeral"

### Current Design
- **Refined slate-gray color scheme**
- **Badges showing functional features** (privacy protection, browser-based processing, real-time analysis)
- **Amber accent colors** (animation elements)
- **Unified color design**
- **Balance of visibility and beauty**
- **Bolt.new badge** indicating development platform

## Future Prospects

### Short-term Improvements
- More detailed usage pattern analysis
- Addition of prediction functionality
- Enhanced export functionality

### Medium-term Expansion
- Extension to support other AI services
- Team usage features
- More advanced analysis functionality

### Long-term Vision
- Establishment as the de facto standard tool for AI usage management
- Addition of enterprise features
- Automatic data acquisition through API integration

## What We Learned

### Technical Learnings
- **Real-time data processing**: Efficient data updates and performance optimization
- **Complex business logic**: Implementation of dynamic reset cycles
- **Usability design**: Importance of intuitive interfaces
- **Internationalization support**: Design patterns for multilingual applications
- **Large data management**: Complexity of filtering, sorting, and pagination
- **Privacy protection**: Design of browser-only applications

### Design Learnings
- **Importance of user feedback**: Value of honest opinions like "too colorful" and "too dark"
- **Gradual improvement**: Importance of improving based on feedback rather than aiming for perfection at once
- **Balance**: Balance between visual impact and practicality
- **Accessibility**: Importance of mechanisms that allow new users to easily try features
- **Feature visualization**: Importance of clearly communicating features like privacy protection and real-time processing

### Project Management Learnings
- **User-centered design**: Strength of projects that started from actual inconveniences
- **Gradual feature addition**: Gradual development from basic to advanced features
- **Continuous improvement**: Importance of continuous improvement based on user feedback
- **Goal clarification**: Importance of always keeping the initial three goals in mind during development

## Conclusion

This project started with the clear purpose of solving daily inconveniences and completely achieved the three core goals of **"real-time usage status confirmation," "understanding reset times," and "efficient resource consumption planning."**

It has developed into a comprehensive solution that balances technical challenges with usability improvements, with particularly significant enhancements in accessibility and practicality through the addition of advanced period history management features (filtering, sorting, pagination) and current period sample data functionality.

Designed with privacy protection as the top priority and with a secure architecture where all processing is completed within the browser, it continues to grow as a truly valuable tool for ClaudeCode users.

Moving forward, we aim to continue developing as a tool that improves the transparency and efficiency of AI usage while responding to user needs.

---

*Last updated: 2025-06-30*  
*Author: Misa Sekine*  
*Development Platform: Bolt.new*