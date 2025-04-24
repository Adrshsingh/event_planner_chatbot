// About Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Animation for stats numbers
    const stats = document.querySelectorAll('.stat-number');
    
    // Function to animate counting up
    function animateStats() {
        stats.forEach(stat => {
            const targetValue = parseInt(stat.textContent.replace("+", ""));
            let currentValue = 0;
            const duration = 2000; // Animation duration in ms
            const interval = 20; // Interval between updates in ms
            const steps = duration / interval;
            const increment = targetValue / steps;
            
            const counter = setInterval(() => {
                currentValue += increment;
                stat.textContent = Math.min(Math.ceil(currentValue), targetValue) + "+";
                
                if (currentValue >= targetValue) {
                    clearInterval(counter);
                }
            }, interval);
        });
    }
    
    // Check if stats section is in viewport and animate
    const statsSection = document.querySelector('.stats-section');
    
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(statsSection);
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add a slight parallax effect to the vision and mission icons
    window.addEventListener('scroll', () => {
        const visionIcon = document.querySelector('.vision-icon i');
        const missionIcon = document.querySelector('.mission-icon i');
        
        if (visionIcon && missionIcon) {
            const scrollPosition = window.scrollY;
            
            visionIcon.style.transform = `translateY(${scrollPosition * 0.05}px)`;
            missionIcon.style.transform = `translateY(${scrollPosition * 0.05}px)`;
        }
    });
    
    // Optional: Add animation to the team member cards
    const teamMembers = document.querySelectorAll('.team-member');
    
    if (teamMembers.length > 0) {
        const teamObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add a slight delay for each card
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 200);
                    teamObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        teamMembers.forEach(member => {
            member.style.opacity = '0';
            member.style.transform = 'translateY(30px)';
            member.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            teamObserver.observe(member);
        });
    }
});