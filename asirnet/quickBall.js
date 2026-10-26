
'use strict';
    
function initQuickBallWithGridMenu(ballId, menuId) {

    const ball = document.getElementById(ballId);
    const menu = document.getElementById(menuId);

    const entire = document.querySelector('.app-con');

    if (!ball || !menu || !entire) return;


    /* =========================
       VARIABLES
    ========================== */

    let isDragging = false;

    let startX = 0;
    let startY = 0;

    let initialX = 0;
    let initialY = 0;

    let hasMoved = false;


    /* =========================
       CONTAINER POSITION
    ========================== */

    function getContainerRect() {
        return entire.getBoundingClientRect();
    }


    /* =========================
       BALL DEFAULT POSITION
    ========================== */

    const containerWidth = entire.clientWidth;
    const containerHeight = entire.clientHeight;

    const defaultX =
        containerWidth -
        ball.offsetWidth -
        20;

    const defaultY =
        (containerHeight -
            ball.offsetHeight) / 2;


    ball.style.left =
        defaultX + "px";

    ball.style.top =
        defaultY + "px";


    /* =========================
       DRAG START
    ========================== */

    function dragStart(e) {

        isDragging = true;
        hasMoved = false;

        menu.classList.remove("active");

        let clientX;
        let clientY;


        if (
            e.touches &&
            e.touches.length > 0
        ) {

            clientX =
                e.touches[0].clientX;

            clientY =
                e.touches[0].clientY;

        } else {

            clientX = e.clientX;
            clientY = e.clientY;
        }


        startX = clientX;
        startY = clientY;


        // Container-এর ভিতরের current position
        initialX = ball.offsetLeft;
        initialY = ball.offsetTop;


        document.addEventListener(
            "mousemove",
            drag
        );

        document.addEventListener(
            "touchmove",
            drag,
            { passive: false }
        );

        document.addEventListener(
            "mouseup",
            dragEnd
        );

        document.addEventListener(
            "touchend",
            dragEnd
        );
    }


    /* =========================
       DRAG
    ========================== */

    function drag(e) {

        if (!isDragging) return;

        e.preventDefault();


        let clientX;
        let clientY;


        if (
            e.touches &&
            e.touches.length > 0
        ) {

            clientX =
                e.touches[0].clientX;

            clientY =
                e.touches[0].clientY;

        } else {

            clientX = e.clientX;
            clientY = e.clientY;
        }


        /* =========================
           DETECT MOVEMENT
        ========================== */

        if (
            Math.abs(clientX - startX) > 5 ||
            Math.abs(clientY - startY) > 5
        ) {

            hasMoved = true;
        }


        const dx =
            clientX - startX;

        const dy =
            clientY - startY;


        let newX =
            initialX + dx;

        let newY =
            initialY + dy;


        /* =========================
           CONTAINER SIZE
        ========================== */

        const containerWidth =
            entire.clientWidth;

        const containerHeight =
            entire.clientHeight;


        /* =========================
           DRAG LIMIT
        ========================== */

        const sideGap = 15;

        const topBottomGap = 20;


        const minX =
            sideGap;

        const maxX =
            containerWidth -
            ball.offsetWidth -
            sideGap;


        const minY =
            topBottomGap;

        const maxY =
            containerHeight -
            ball.offsetHeight -
            topBottomGap;


        /* =========================
           CLAMP POSITION
        ========================== */

        newX =
            Math.max(
                minX,
                Math.min(
                    newX,
                    maxX
                )
            );


        newY =
            Math.max(
                minY,
                Math.min(
                    newY,
                    maxY
                )
            );


        /* =========================
           APPLY POSITION
        ========================== */

        ball.style.left =
            newX + "px";

        ball.style.top =
            newY + "px";
    }


    /* =========================
       DRAG END
    ========================== */

    function dragEnd() {

        if (!isDragging) return;

        isDragging = false;


        /* =========================
           REMOVE EVENTS
        ========================== */

        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "touchmove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            dragEnd
        );

        document.removeEventListener(
            "touchend",
            dragEnd
        );


        /* =========================
           TRANSITION
        ========================== */

        ball.style.transition =
            "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), " +
            "top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), " +
            "transform 0.2s ease";


        /* =========================
           CONTAINER SIZE
        ========================== */

        const containerWidth =
            entire.clientWidth;

        const containerHeight =
            entire.clientHeight;


        const currentX =
            ball.offsetLeft;

        const currentY =
            ball.offsetTop;


        const sideGap = 15;

        const topBottomGap = 20;


        /* =========================
           CENTER
        ========================== */

        const centerX =
            containerWidth / 2;


        /* =========================
           SNAP LEFT / RIGHT
        ========================== */

        let targetX;


        if (
            currentX +
            ball.offsetWidth / 2 <
            centerX
        ) {

            // LEFT SIDE

            targetX =
                sideGap;

        } else {

            // RIGHT SIDE

            targetX =
                containerWidth -
                ball.offsetWidth -
                sideGap;
        }


        /* =========================
           VERTICAL POSITION
        ========================== */

        let targetY =
            Math.max(
                topBottomGap,
                Math.min(
                    currentY,
                    containerHeight -
                    ball.offsetHeight -
                    topBottomGap
                )
            );


        /* =========================
           APPLY SNAP
        ========================== */

        ball.style.left =
            targetX + "px";

        ball.style.top =
            targetY + "px";
    }


    /* =========================
       BALL EVENTS
    ========================== */

    ball.addEventListener(
        "mousedown",
        dragStart
    );


    ball.addEventListener(
        "touchstart",
        dragStart,
        { passive: false }
    );


    /* =========================
       BALL CLICK
    ========================== */

    ball.addEventListener(
        "click",
        function(e) {
        
            if (hasMoved) {

                hasMoved = false;

                return;
            }
            e.stopPropagation(); 
            toggleMenu();
        }
    );


    /* =========================
       TOGGLE MENU
    ========================== */

function toggleMenu() {

    /* =========================
       MENU CLOSE
    ========================== */

    if (menu.classList.contains("active")) {

        menu.classList.remove("active");

        return;
    }


    /* =========================
       CONTAINER RECT
    ========================== */

    const containerRect =
        entire.getBoundingClientRect();


    const ballRect =
        ball.getBoundingClientRect();


    /* =========================
       ACTIVATE FIRST
       যাতে আসল width পাওয়া যায়
    ========================== */

    menu.classList.add("active");


    /* =========================
       REAL MENU SIZE
    ========================== */

    const menuWidth =
        menu.offsetWidth;

    const menuHeight =
        menu.offsetHeight;


    const gap = 12;

    const sideGap = 15;

    const topGap = 15;


    /* =========================
       BALL POSITION
       CONTAINER-এর ভিতরে
    ========================== */

    const ballCenterX =
        ballRect.left +
        (ballRect.width / 2);


    const containerCenterX =
        containerRect.left +
        (containerRect.width / 2);


    const isRightSide =
        ballCenterX > containerCenterX;


    let menuLeft;
    let menuTop;


    /* =========================
       RIGHT SIDE BALL
       MENU LEFT
    ========================== */

    if (isRightSide) {

        menuLeft =
            ballRect.left -
            containerRect.left -
            menuWidth -
            gap;

    }


    /* =========================
       LEFT SIDE BALL
       MENU RIGHT
    ========================== */

    else {

        menuLeft =
            ballRect.right -
            containerRect.left +
            gap;
    }


    /* =========================
       HORIZONTAL LIMIT
    ========================== */

    const containerWidth =
        entire.clientWidth;

    if (menuWidth >= containerWidth) {

        menuLeft =
            (containerWidth -
                menuWidth) / 2;

    }

    else {

        menuLeft =
            Math.max(
                sideGap,
                Math.min(
                    menuLeft,
                    containerWidth -
                    menuWidth -
                    sideGap
                )
            );
    }


    /* =========================
       VERTICAL POSITION
    ========================== */

    menuTop =
        ballRect.top -
        containerRect.top;


    const containerHeight =
        entire.clientHeight;

    if (
        menuTop +
        menuHeight >
        containerHeight -
        topGap
    ) {

        menuTop =
            containerHeight -
            menuHeight -
            topGap;
    }

    if (menuTop < topGap) {

        menuTop = topGap;
    }


    /* =========================
       APPLY POSITION
    ========================== */

    menu.style.left =
        menuLeft + "px";

    menu.style.top =
        menuTop + "px";


        /* =========================
           OPEN
        ========================== */

        menu.classList.add(
            "active"
        );
    }


    /* =========================
       CLICK OUTSIDE
    ========================== */

    document.addEventListener(
        "click",
        function(e) {

            if (
                !ball.contains(e.target) &&
                !menu.contains(e.target)
            ) {

                menu.classList.remove(
                    "active"
                );
            }
        }
    );
 

    /* =========================
       CONTAINER RESIZE
    ========================== */

    const resizeObserver =
        new ResizeObserver(
            function() {

                menu.classList.remove(
                    "active"
                );


                const containerWidth =
                    entire.clientWidth;

                const containerHeight =
                    entire.clientHeight;


                const maxX =
                    containerWidth -
                    ball.offsetWidth -
                    15;


                const maxY =
                    containerHeight -
                    ball.offsetHeight -
                    20;


                let currentX =
                    ball.offsetLeft;

                let currentY =
                    ball.offsetTop;


                currentX =
                    Math.max(
                        15,
                        Math.min(
                            currentX,
                            maxX
                        )
                    );


                currentY =
                    Math.max(
                        20,
                        Math.min(
                            currentY,
                            maxY
                        )
                    );


                ball.style.left =
                    currentX + "px";

                ball.style.top =
                    currentY + "px";
            }
        );


    resizeObserver.observe(
        entire
    );
}


/* =========================
   INITIALIZE
========================= */

initQuickBallWithGridMenu(
    "myQuickBall",
    "myQuickMenu"
);
