// ===== Audio Setup =====
let isGlobalMuted = false;
const audioHerSong = new Audio('songs/her v+m.mp3');
audioHerSong.loop = true;
const audioDreamaria = new Audio('songs/dreamaria.mp3');
audioDreamaria.loop = true;
const audioDheema = new Audio('songs/dheema.mp3');
audioDheema.loop = true;

let currentAudio = null;

function fadeAudioIn(audio, targetVolume = 1, startTime = 0) {
    if (!audio) return;
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);

    if (audio.paused) {
        if (startTime > 0) {
            audio.currentTime = startTime;
        }
        audio.volume = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
    }

    audio.fadeInterval = setInterval(() => {
        if (audio.volume < targetVolume - 0.04) {
            audio.volume += 0.05;
        } else {
            audio.volume = targetVolume;
            clearInterval(audio.fadeInterval);
        }
    }, 100);
    currentAudio = audio;
}

function fadeAudioOut(audio, callback, interval = 100) {
    if (!audio) {
        if (callback) callback();
        return;
    }
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);

    if (audio.paused || audio.volume === 0) {
        if (callback) callback();
        return;
    }

    audio.fadeInterval = setInterval(() => {
        if (audio.volume > 0.05) {
            audio.volume -= 0.05;
        } else {
            audio.pause();
            audio.volume = 0;
            clearInterval(audio.fadeInterval);
            if (callback) callback();
        }
    }, interval);
}

function toggleMute() {
    isGlobalMuted = !isGlobalMuted;
    audioHerSong.muted = isGlobalMuted;
    audioDreamaria.muted = isGlobalMuted;
    audioDheema.muted = isGlobalMuted;

    document.querySelectorAll('video').forEach(vid => vid.muted = isGlobalMuted);

    const unmutedIcon = document.querySelector('.icon-unmuted');
    const mutedIcon = document.querySelector('.icon-muted');
    if (unmutedIcon && mutedIcon) {
        unmutedIcon.style.display = isGlobalMuted ? 'none' : 'block';
        mutedIcon.style.display = isGlobalMuted ? 'block' : 'none';
    }
}

// ===== Initial State & Start Button =====
document.getElementById('start-btn').addEventListener('click', () => {
    document.body.classList.remove('locked');
    const overlay = document.getElementById('warning-overlay');
    overlay.classList.add('hidden');

    document.getElementById('muteBtn').style.display = 'flex';

    // Start Audio
    setTimeout(() => {
        fadeAudioIn(audioHerSong);
    }, 500);
});

// ===== Pagination Controller =====
let currentPageIndex = 0;
let pages = [];

document.addEventListener('DOMContentLoaded', () => {
    pages = Array.from(document.querySelectorAll('.page'));
    updatePagination();
});

function updatePagination() {
    pages.forEach((page, index) => {
        if (index === currentPageIndex) {
            page.classList.add('active');
            triggerPageAnimations(page);
            handlePageMedia(page);
        } else {
            page.classList.remove('active');
            pausePageMedia(page);
        }
    });

    // Update nav buttons
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');
    
    let isNextBlooper = false;
    if (currentPageIndex + 1 < pages.length && pages[currentPageIndex + 1].id === 'page-blooper') {
        isNextBlooper = true;
    }

    if (prevBtn) {
        let isCurrentBlooper = pages[currentPageIndex].id === 'page-blooper';
        prevBtn.disabled = currentPageIndex === 0 || isCurrentBlooper;
        prevBtn.style.display = isCurrentBlooper ? 'none' : 'flex';
    }
    if (nextBtn) {
        nextBtn.disabled = currentPageIndex === pages.length - 1 || isNextBlooper;
        nextBtn.style.display = (currentPageIndex === pages.length - 1 || isNextBlooper) ? 'none' : 'flex';
    }
}

function nextPage() {
    let isNextBlooper = false;
    if (currentPageIndex + 1 < pages.length && pages[currentPageIndex + 1].id === 'page-blooper') {
        isNextBlooper = true;
    }
    
    if (currentPageIndex < pages.length - 1 && !isNextBlooper) {
        currentPageIndex++;
        updatePagination();
    }
}

function prevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        updatePagination();
    }
}

function triggerPageAnimations(page) {
    // Re-trigger fade up
    const fadeElements = page.querySelectorAll('.gs-fade-up, .gs-zoom-in');
    fadeElements.forEach(el => {
        gsap.fromTo(el,
            {
                y: el.classList.contains('gs-zoom-in') ? 0 : 50,
                scale: el.classList.contains('gs-zoom-in') ? 0.8 : 1,
                opacity: 0
            },
            {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 1,
                ease: "power3.out"
            }
        );
    });

    // Re-trigger staggered lists
    const promises = page.querySelectorAll('.promises-list .promise-item');
    if (promises.length > 0) {
        gsap.fromTo(promises,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }
        );
    }

    // Trigger side message typewriter if exists on this page
    const sideMsg = page.querySelector('.typewriter-side-msg');
    if (sideMsg) {
        startSideTypewriter(sideMsg);
    }
}

function startSideTypewriter(p) {
    // Avoid double typing if we return to the page
    if (p.dataset.typed === "true") return;
    p.dataset.typed = "true";
    p.style.opacity = 1;

    // Save text and clear
    const text = p.innerText.trim();
    if (!p.dataset.originalText) {
        p.dataset.originalText = text;
    }
    const fullText = p.dataset.originalText;
    p.innerHTML = '';
    p.classList.add('typewriter-text-active');

    let charIndex = 0;

    if (p.typewriterTimeout) clearTimeout(p.typewriterTimeout);
    if (p.initialTimeout) clearTimeout(p.initialTimeout);

    // Wait a bit for the fade-up to finish
    p.initialTimeout = setTimeout(() => {
        function typeChar() {
            if (charIndex < fullText.length) {
                p.innerHTML += fullText.charAt(charIndex);
                charIndex++;
                p.typewriterTimeout = setTimeout(typeChar, 60);
            } else {
                p.classList.remove('typewriter-text-active');
            }
        }
        typeChar();
    }, 800);
}

function handlePageMedia(page) {
    const videos = page.querySelectorAll('video');
    const pageIndex = pages.indexOf(page);
    const collageIndex = pages.findIndex(p => p.id === 'page-collage');
    const quote3Index = pages.findIndex(p => p.id === 'page-quote3');
    const meaningIndex = pages.findIndex(p => p.id === 'meaning');
    const almostDoneIndex = pages.findIndex(p => p.id === 'page-almost-done');
    const changeVibeIndex = pages.findIndex(p => p.id === 'page-change-vibe');

    if (videos.length > 0) {
        videos.forEach(v => {
            v.muted = isGlobalMuted;
            v.play().catch(e => console.log("Video autoplay prevented:", e));
        });
        fadeAudioOut(audioHerSong, null, 50); // fast fade out background song
        fadeAudioOut(audioDreamaria, null, 50);
        fadeAudioOut(audioDheema, null, 50);
    } else {
        if (!document.body.classList.contains('locked')) {
            if ((almostDoneIndex !== -1 && pageIndex === almostDoneIndex) || (changeVibeIndex !== -1 && pageIndex === changeVibeIndex)) {
                fadeAudioOut(audioDheema, null, 50);
                fadeAudioOut(audioDreamaria, null, 50);
                fadeAudioOut(audioHerSong, null, 50);
            } else if (meaningIndex !== -1 && pageIndex >= meaningIndex) {
                fadeAudioIn(audioDheema, 0.25);
                fadeAudioOut(audioDreamaria, null, 50);
                fadeAudioOut(audioHerSong, null, 50);
            } else if (quote3Index !== -1 && pageIndex >= quote3Index) {
                fadeAudioIn(audioDreamaria, 1, 3);
                fadeAudioOut(audioDheema, null, 50);
                fadeAudioOut(audioHerSong, null, 50);
            } else if (collageIndex !== -1 && pageIndex <= collageIndex) {
                fadeAudioIn(audioHerSong); // fade back in background song
                fadeAudioOut(audioDreamaria, null, 50);
                fadeAudioOut(audioDheema, null, 50);
            } else {
                fadeAudioOut(audioHerSong, null, 50); // keep it faded out or fade out
                fadeAudioOut(audioDreamaria, null, 50);
                fadeAudioOut(audioDheema, null, 50);
            }
        }
    }
}

function pausePageMedia(page) {
    const videos = page.querySelectorAll('video');
    videos.forEach(v => v.pause());

    // Reset typewriter so it replays if they navigate away and back
    const sideMsg = page.querySelector('.typewriter-side-msg');
    if (sideMsg && sideMsg.dataset.typed === "true") {
        sideMsg.dataset.typed = "false";
        
        if (sideMsg.typewriterTimeout) clearTimeout(sideMsg.typewriterTimeout);
        if (sideMsg.initialTimeout) clearTimeout(sideMsg.initialTimeout);

        sideMsg.innerHTML = sideMsg.dataset.originalText;
        sideMsg.style.opacity = 0;
        sideMsg.classList.remove('typewriter-text-active');
    }
}

// ===== Book Interaction =====
let bookIsOpen = false;
let currentBookPage = 0; // 0 = cover visible, 1 = page 1 visible, etc.
const totalBookPages = 11;

window.openBook = function () {
    if (bookIsOpen) return;
    bookIsOpen = true;

    const cover = document.getElementById('book-cover');
    const btn = document.getElementById('btn-open-book');
    const hint = document.getElementById('page-turn-hint');

    // Fade out the button
    if (btn) {
        gsap.to(btn, { opacity: 0, pointerEvents: 'none', duration: 0.4 });
    }

    // Shift the book to the center
    const book = document.getElementById('the-book');
    if (book) book.classList.add('open');

    // Setup pages BEFORE animation so they are stacked correctly immediately
    setupBookPages();

    // Animate cover opening (flip left like a real book cover)
    const tl = gsap.timeline();
    tl.to(cover, {
        rotateY: -180,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
            cover.style.pointerEvents = 'none';
            // Enable page interactions
            currentBookPage = 1;
            // Show hint
            if (hint) hint.classList.add('visible');
        }
    });
};

function setupBookPages() {
    const pages = document.querySelectorAll('.book-page');
    const totalPages = pages.length;

    pages.forEach((page, i) => {
        // Stack pages: first page on top (highest z-index)
        page.style.zIndex = totalPages - i;
        page.style.pointerEvents = 'auto';

        // Add click zone to the right half of each page front
        const front = page.querySelector('.page-front');
        if (front && !front.querySelector('.page-click-zone')) {
            const clickZone = document.createElement('div');
            clickZone.className = 'page-click-zone';
            clickZone.addEventListener('click', () => {
                turnPage(i);
            });
            front.appendChild(clickZone);
        }
    });
}

function turnPage(pageIndex) {
    const pages = document.querySelectorAll('.book-page');
    const page = pages[pageIndex];

    // Don't turn if already turned
    if (page.classList.contains('turned')) return;

    // Don't turn out of order — only the topmost unturned page
    for (let i = 0; i < pageIndex; i++) {
        if (!pages[i].classList.contains('turned')) return;
    }

    page.classList.add('turned');

    // Bring turning page to top z-index during animation
    const prevZ = page.style.zIndex;
    page.style.zIndex = 200;

    gsap.to(page, {
        rotateY: -180,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
            page.style.zIndex = prevZ;
            // Removed: page.style.pointerEvents = 'none'; so we can click the back
            currentBookPage = pageIndex + 2; // next page visible

            // Hide hint after first turn
            const hint = document.getElementById('page-turn-hint');
            if (hint) hint.classList.remove('visible');

            // If all pages turned, you've read the whole book
            if (currentBookPage > 9) {
                closeBook();
            }
        }
    });
}

// Global handler for the left-side click zone to go back
window.turnPreviousPage = function() {
    const pages = document.querySelectorAll('.book-page');
    // Find the highest index page that is currently turned
    let lastTurnedIndex = -1;
    for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i].classList.contains('turned')) {
            lastTurnedIndex = i;
            break;
        }
    }
    
    if (lastTurnedIndex !== -1) {
        turnPageBack(lastTurnedIndex);
    }
};

function turnPageBack(pageIndex) {
    const pages = document.querySelectorAll('.book-page');
    const page = pages[pageIndex];

    // Don't turn back if not turned
    if (!page.classList.contains('turned')) return;

    // Don't turn back out of order
    for (let i = pageIndex + 1; i < pages.length; i++) {
        if (pages[i].classList.contains('turned')) return;
    }

    page.classList.remove('turned');

    const prevZ = page.style.zIndex;
    page.style.zIndex = 200;

    gsap.to(page, {
        rotateY: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
            page.style.zIndex = prevZ;
            currentBookPage = pageIndex + 1;
        }
    });
}

function closeBook() {
    const pages = document.querySelectorAll('.book-page');
    const cover = document.getElementById('book-cover');
    const book = document.getElementById('the-book');
    
    // Animate all turned pages back to 0
    let delay = 0;
    for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i].classList.contains('turned')) {
            pages[i].classList.remove('turned');
            gsap.to(pages[i], {
                rotateY: 0,
                duration: 0.6,
                delay: delay,
                ease: "power2.inOut"
            });
            delay += 0.15;
        }
    }

    // Finally close the cover
    gsap.to(cover, {
        rotateY: 0,
        duration: 1.2,
        delay: delay + 0.2,
        ease: "power2.inOut",
        onComplete: () => {
            cover.style.pointerEvents = 'auto';
            bookIsOpen = false;
            currentBookPage = 0;
            
            // Remove open state so it shifts back to center
            if (book) book.classList.remove('open');
            
            // Re-enable pages so they can't be clicked when closed
            pages.forEach(p => p.style.pointerEvents = 'none');
            
            // Flip the book to show the true back cover
            gsap.to(book, {
                rotateY: 180,
                duration: 1.5,
                delay: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    const outerBack = document.getElementById('book-outer-back');
                    if (outerBack) outerBack.style.pointerEvents = 'auto';
                }
            });
        }
    });
}

window.flipBookToFront = function() {
    const book = document.getElementById('the-book');
    const outerBack = document.getElementById('book-outer-back');
    if (outerBack) outerBack.style.pointerEvents = 'none';
    
    gsap.to(book, {
        rotateY: 0,
        duration: 1.5,
        ease: "power2.inOut"
    });
};

// ===== Memory Carousel Interaction (Stairs) =====
let currentCarouselIndex = 0;
const totalCarouselImages = 4;

document.addEventListener('DOMContentLoaded', () => {
    goToCarousel(0);
});



function goToCarousel(index) {
    const stairs = document.getElementById('memory-stairs');
    if (!stairs) return;

    const images = stairs.querySelectorAll('.carousel-img');

    // Toggle fullscreen if clicking the already active image
    if (currentCarouselIndex === index && document.readyState === 'complete') {
        const activeImg = images[index];
        activeImg.classList.toggle('carousel-fullscreen');
        return;
    }

    currentCarouselIndex = index;

    images.forEach((img, i) => {
        img.classList.remove('carousel-fullscreen'); // ensure none are fullscreen
        img.style.pointerEvents = 'auto';
        img.style.opacity = '1';

        if (i < currentCarouselIndex) {
            // Previous images poke out on the left
            img.style.transform = `translate(-50%, -50%) translateX(-${(currentCarouselIndex - i) * 20}%) scale(${1 - (currentCarouselIndex - i) * 0.1})`;
            img.style.zIndex = i;
            img.style.filter = `brightness(${1 - (currentCarouselIndex - i) * 0.3})`;
        } else if (i === currentCarouselIndex) {
            // Active image center
            img.style.transform = `translate(-50%, -50%) translateX(0) scale(1)`;
            img.style.zIndex = 10;
            img.style.filter = 'brightness(1)';
        } else {
            // Next images poke out on the right
            img.style.transform = `translate(-50%, -50%) translateX(${(i - currentCarouselIndex) * 20}%) scale(${1 - (i - currentCarouselIndex) * 0.1})`;
            img.style.zIndex = 10 - (i - currentCarouselIndex);
            img.style.filter = `brightness(${1 - (i - currentCarouselIndex) * 0.3})`;
        }
    });

    // Show scroll message if at the end
    const scrollMsg = document.getElementById('carousel-scroll-msg');
    if (scrollMsg) {
        if (currentCarouselIndex === totalCarouselImages - 1) {
            scrollMsg.classList.remove('hidden');
        } else {
            scrollMsg.classList.add('hidden');
        }
    }
}



// Removed Intersection Observer logic as it is now handled by Pagination.




// ===== Modals =====
function handleForgive() {
    const modal = document.getElementById('modalForgive');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function handleThinking() {
    const modal = document.getElementById('modalThinking');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function goToBlooper() {
    closeModal('modalForgive');
    const blooperIndex = pages.findIndex(p => p.id === 'page-blooper');
    if (blooperIndex !== -1) {
        currentPageIndex = blooperIndex;
        updatePagination();
    }
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            closeModal(modal.id);
        });
    }
});
