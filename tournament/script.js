"use strict";


/* =========================================
   SUPABASE KONFIGURATION
   ========================================= */

const SUPABASE_URL =
    "https://ylphreyqfcnhmomqsfbe.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_v4zKEbe5ypgXoE_0T8-NBA_c_TLN5Cl";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================
   KONFIGURATION
   ========================================= */

const PLAYER_TEES = [
    "yellow",
    "white",
    "blue",
    "red"
];


const TEE_LABELS = {
    yellow: "Yellow",
    white: "White",
    blue: "Blue",
    red: "Red"
};


/*
 * Die neuen Course-Spalten.
 *
 * CR = Course Rating
 * Slope = Slope Rating
 */

const COURSE_TEE_FIELDS = {

    yellow: {
        cr: "cr_yellow",
        slope: "slope_yellow"
    },

    white: {
        cr: "cr_white",
        slope: "slope_white"
    },

    blue: {
        cr: "cr_blue",
        slope: "slope_blue"
    },

    red: {
        cr: "cr_red",
        slope: "slope_red"
    }

};


/* =========================================
   DOM
   ========================================= */

const coursesBody =
    document.getElementById(
        "courses-body"
    );


const roundsBody =
    document.getElementById(
        "rounds-body"
    );


const playersBody =
    document.getElementById(
        "players-body"
    );

    const flightsBody =
    document.getElementById(
        "flights-body"
    );

const coursesEmpty =
    document.getElementById(
        "courses-empty"
    );


const roundsEmpty =
    document.getElementById(
        "rounds-empty"
    );


const playersEmpty =
    document.getElementById(
        "players-empty"
    );

    const flightsEmpty =
    document.getElementById(
        "flights-empty"
    );

const connectionStatus =
    document.getElementById(
        "connection-status"
    );


const globalStatus =
    document.getElementById(
        "global-status"
    );


/* =========================================
   LOKALE DATEN
   ========================================= */

let courses = [];

let rounds = [];

let players = [];

let flights = [];

let selectedMode = null;

let statusTimer = null;


/* =========================================
   INITIALISIERUNG
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


async function initializeApplication() {

    setupEventListeners();

    setConnectionStatus(
        true,
        "Connected"
    );

    await loadAllData();

}


/* =========================================
   EVENT LISTENER
   ========================================= */

function setupEventListeners() {

    const addCourseButton =
        document.getElementById(
            "add-course"
        );


    const addRoundButton =
        document.getElementById(
            "add-round"
        );


    const addPlayerButton =
        document.getElementById(
            "add-player"
        );

    const addFlightButton =
    document.getElementById(
        "add-flight"
    );    

    if (addCourseButton) {

        addCourseButton.addEventListener(
            "click",
            addCourse
        );

    }


    if (addRoundButton) {

        addRoundButton.addEventListener(
            "click",
            addRound
        );

    }


    if (addPlayerButton) {

        addPlayerButton.addEventListener(
            "click",
            addPlayer
        );

    }

if (addFlightButton) {
    addFlightButton.addEventListener(
        "click",
        addFlight
    );
}


    document
        .querySelectorAll(".mode-card")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectMode(
                            button.dataset.mode
                        );

                    }
                );

            }
        );

}


/* =========================================
   SUPABASE VERBINDUNG
   ========================================= */

function setConnectionStatus(
    connected,
    text
) {

    if (!connectionStatus) {
        return;
    }


    const dot =
        connectionStatus.querySelector(
            ".status-dot"
        );


    const statusText =
        connectionStatus.querySelector(
            ".status-text"
        );


    if (statusText) {

        statusText.textContent =
            text;

    }


    if (dot) {

        dot.style.background =
            connected
                ? "#4caf50"
                : "#d9534f";

    }

}


/* =========================================
   ALLE DATEN LADEN
   ========================================= */

async function loadAllData() {

    try {

        await loadCourses();

await loadRounds();

await loadPlayers();

await loadFlights();

    }

    catch (error) {

        console.error(
            "Error loading tournament data:",
            error
        );


        showStatus(
            "Tournament data could not be loaded.",
            true
        );

    }

}


/* =========================================
   COURSES LADEN
   ========================================= */

async function loadCourses() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("courses")
            .select("*")
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Courses could not be loaded:",
            error
        );


        showStatus(
            "Courses could not be loaded.",
            true
        );


        return;

    }


    courses =
        data || [];


    renderCourses();

}


/* =========================================
   COURSES RENDERN
   ========================================= */

function renderCourses() {

    coursesBody.innerHTML =
        "";


    coursesEmpty.style.display =
        courses.length === 0
            ? "block"
            : "none";


    courses.forEach(
        course => {

            const row =
                createCourseRow(
                    course
                );


            coursesBody.appendChild(
                row
            );

        }
    );

}


/* =========================================
   COURSE ZEILE
   ========================================= */

function createCourseRow(
    course
) {

    const row =
        document.createElement(
            "tr"
        );


    /* =====================================
       COURSE NAME
       ===================================== */

    const nameCell =
        document.createElement(
            "td"
        );


    const nameInput =
        document.createElement(
            "input"
        );


    nameInput.type =
        "text";


    nameInput.className =
        "course-input course-name-input";


    nameInput.value =
        course.course_name || "";


    nameInput.placeholder =
        "Course name";


    nameInput.addEventListener(
        "change",
        () => {

            updateCourseField(
                course.id,
                "course_name",
                nameInput.value.trim()
            );

        }
    );


    nameCell.appendChild(
        nameInput
    );


    row.appendChild(
        nameCell
    );


    /* =====================================
       18 LÖCHER
       ===================================== */

    for (
        let hole = 1;
        hole <= 18;
        hole++
    ) {

        const holeNumber =
            String(hole)
                .padStart(2, "0");


        const parColumn =
            `${holeNumber}_par`;


        const hcpColumn =
            `${holeNumber}_hcp`;


        const parCell =
            document.createElement(
                "td"
            );


        parCell.appendChild(
            createCourseNumberInput(
                course,
                parColumn,
                1,
                6
            )
        );


        row.appendChild(
            parCell
        );


        const hcpCell =
            document.createElement(
                "td"
            );


        hcpCell.appendChild(
            createCourseNumberInput(
                course,
                hcpColumn,
                1,
                18
            )
        );


        row.appendChild(
            hcpCell
        );

    }


    /* =====================================
       TEE-WERTE
       ===================================== */

    PLAYER_TEES.forEach(
        tee => {

            const fields =
                COURSE_TEE_FIELDS[tee];


            /* -----------------------------
               COURSE RATING
               ----------------------------- */

            const crCell =
                document.createElement(
                    "td"
                );


            crCell.appendChild(
                createCourseDecimalInput(
                    course,
                    fields.cr
                )
            );


            row.appendChild(
                crCell
            );


            /* -----------------------------
               SLOPE
               ----------------------------- */

            const slopeCell =
                document.createElement(
                    "td"
                );


            slopeCell.appendChild(
                createCourseNumberInput(
                    course,
                    fields.slope,
                    55,
                    155
                )
            );


            row.appendChild(
                slopeCell
            );

        }
    );


    /* =====================================
       DELETE
       ===================================== */

    const actionCell =
        document.createElement(
            "td"
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-button";


    deleteButton.textContent =
        "×";


    deleteButton.title =
        "Delete course";


    deleteButton.addEventListener(
        "click",
        () => {

            deleteCourse(
                course
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        actionCell
    );


    return row;

}


/* =========================================
   COURSE ZAHLENINPUT
   ========================================= */

function createCourseNumberInput(
    course,
    column,
    min,
    max
) {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "number";


    input.className =
        "course-input";


    input.value =
        course[column] ?? "";


    if (
        min !== undefined
    ) {

        input.min =
            String(min);

    }


    if (
        max !== undefined
    ) {

        input.max =
            String(max);

    }


    input.addEventListener(
        "change",
        () => {

            let value =
                input.value === ""
                    ? null
                    : Number(
                        input.value
                    );


            if (
                value !== null &&
                !Number.isFinite(value)
            ) {

                value =
                    null;

            }


            updateCourseField(
                course.id,
                column,
                value
            );

        }
    );


    return input;

}


/* =========================================
   COURSE DECIMAL INPUT
   ========================================= */

function createCourseDecimalInput(
    course,
    column
) {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "number";


    input.step =
        "0.1";


    input.min =
        "50";


    input.max =
        "90";


    input.className =
        "course-input";


    input.value =
        course[column] ?? "";


    input.addEventListener(
        "change",
        () => {

            let value =
                input.value === ""
                    ? null
                    : Number(
                        input.value
                    );


            if (
                value !== null &&
                !Number.isFinite(value)
            ) {

                value =
                    null;

            }


            updateCourseField(
                course.id,
                column,
                value
            );

        }
    );


    return input;

}


/* =========================================
   COURSE HINZUFÜGEN
   ========================================= */

async function addCourse() {

    const newCourse = {

        course_name:
            "New Course"

    };


    /*
     * Standardwerte für die 18 Löcher.
     */

    for (
        let hole = 1;
        hole <= 18;
        hole++
    ) {

        const number =
            String(hole)
                .padStart(2, "0");


        newCourse[
            `${number}_par`
        ] = 4;


        newCourse[
            `${number}_hcp`
        ] = hole;

    }


    /*
     * Neue Tee-Werte bleiben zunächst leer.
     */

    PLAYER_TEES.forEach(
        tee => {

            const fields =
                COURSE_TEE_FIELDS[tee];


            newCourse[
                fields.cr
            ] = null;


            newCourse[
                fields.slope
            ] = null;

        }
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("courses")
            .insert([
                newCourse
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Course could not be created:",
            error
        );


        showStatus(
            `Course could not be created: ${error.message}`,
            true
        );


        return;

    }


    courses.push(
        data
    );


    renderCourses();

    updateCourseDropdowns();


    showStatus(
        "Course added."
    );

}


/* =========================================
   COURSE ÄNDERN
   ========================================= */

async function updateCourseField(
    courseId,
    column,
    value
) {

    const {
        error
    } =
        await supabaseClient
            .from("courses")
            .update({

                [column]:
                    value

            })
            .eq(
                "id",
                courseId
            );


    if (error) {

        console.error(
            "Course could not be updated:",
            error
        );


        showStatus(
            `Course could not be updated: ${error.message}`,
            true
        );


        return;

    }


    const course =
        courses.find(
            item =>
                item.id === courseId
        );


    if (course) {

        course[column] =
            value;

    }


    updateCourseDropdowns();

}


/* =========================================
   COURSE LÖSCHEN
   ========================================= */

async function deleteCourse(
    course
) {

    const confirmed =
        window.confirm(
            `Delete "${course.course_name}"?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("courses")
            .delete()
            .eq(
                "id",
                course.id
            );


    if (error) {

        console.error(
            "Course could not be deleted:",
            error
        );


        showStatus(
            `Course could not be deleted: ${error.message}`,
            true
        );


        return;

    }


    courses =
        courses.filter(
            item =>
                item.id !== course.id
        );


    renderCourses();

    updateCourseDropdowns();


    showStatus(
        "Course deleted."
    );

}


/* =========================================
   ROUNDS LADEN
   ========================================= */

async function loadRounds() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("rounds")
            .select("*")
            .order(
                "round_number",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Rounds could not be loaded:",
            error
        );


        rounds =
            [];


        renderRounds();

        return;

    }


    rounds =
        data || [];


    if (
        rounds.length === 0
    ) {

        await createInitialRound();

        return;

    }


    renderRounds();

}


/* =========================================
   ERSTE RUNDE
   ========================================= */

async function createInitialRound() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("rounds")
            .insert([
                {

                    round_number:
                        1,

                    course_id:
                        courses.length > 0
                            ? courses[0].id
                            : null

                }
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Initial round could not be created:",
            error
        );


        rounds =
            [];


        renderRounds();

        return;

    }


    rounds =
        [data];


    renderRounds();

}


/* =========================================
   ROUNDS RENDERN
   ========================================= */

function renderRounds() {

    roundsBody.innerHTML =
        "";


    roundsEmpty.style.display =
        rounds.length === 0
            ? "block"
            : "none";


    rounds.forEach(
        round => {

            roundsBody.appendChild(
                createRoundRow(
                    round
                )
            );

        }
    );

}


/* =========================================
   ROUND ZEILE
   ========================================= */

function createRoundRow(
    round
) {

    const row =
        document.createElement(
            "tr"
        );


    /* ROUND NUMBER */

    const numberCell =
        document.createElement(
            "td"
        );


    const roundName =
        document.createElement(
            "span"
        );


    roundName.className =
        "round-name";


    roundName.textContent =
        `Round ${round.round_number}`;


    numberCell.appendChild(
        roundName
    );


    row.appendChild(
        numberCell
    );


    /* COURSE */

    const courseCell =
        document.createElement(
            "td"
        );


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "course-select";


    const emptyOption =
        document.createElement(
            "option"
        );


    emptyOption.value =
        "";


    emptyOption.textContent =
        "Select course...";


    select.appendChild(
        emptyOption
    );


    courses.forEach(
        course => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                course.id;


            option.textContent =
                course.course_name ||
                "Unnamed Course";


            if (
                String(course.id) ===
                String(round.course_id)
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );


    select.addEventListener(
        "change",
        () => {

            updateRoundCourse(
                round.id,
                select.value
                    ? select.value
                    : null
            );

        }
    );


    courseCell.appendChild(
        select
    );


    row.appendChild(
        courseCell
    );


    /* STATUS */

    const statusCell =
        document.createElement(
            "td"
        );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "round-status";


    status.textContent =
        round.course_id
            ? "Configured"
            : "Needs course";


    statusCell.appendChild(
        status
    );


    row.appendChild(
        statusCell
    );


    /* DELETE */

    const actionCell =
        document.createElement(
            "td"
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-button";


    deleteButton.textContent =
        "×";


    deleteButton.title =
        "Delete round";


    deleteButton.addEventListener(
        "click",
        () => {

            deleteRound(
                round
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        actionCell
    );


    return row;

}


/* =========================================
   ROUND HINZUFÜGEN
   ========================================= */

async function addRound() {

    const nextNumber =
        rounds.length === 0
            ? 1
            : Math.max(
                ...rounds.map(
                    round =>
                        Number(
                            round.round_number
                        ) || 0
                )
            ) + 1;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("rounds")
            .insert([
                {

                    round_number:
                        nextNumber,

                    course_id:
                        courses.length > 0
                            ? courses[0].id
                            : null

                }
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Round could not be created:",
            error
        );


        showStatus(
            `Round could not be created: ${error.message}`,
            true
        );


        return;

    }


    rounds.push(
        data
    );


    rounds.sort(
        (
            a,
            b
        ) =>
            a.round_number -
            b.round_number
    );


    renderRounds();


    showStatus(
        `Round ${nextNumber} added.`
    );

}


/* =========================================
   ROUND COURSE ÄNDERN
   ========================================= */

async function updateRoundCourse(
    roundId,
    courseId
) {

    const {
        error
    } =
        await supabaseClient
            .from("rounds")
            .update({

                course_id:
                    courseId

            })
            .eq(
                "id",
                roundId
            );


    if (error) {

        console.error(
            "Round could not be updated:",
            error
        );


        showStatus(
            `Round could not be updated: ${error.message}`,
            true
        );


        return;

    }


    const round =
        rounds.find(
            item =>
                item.id === roundId
        );


    if (round) {

        round.course_id =
            courseId;

    }


    renderRounds();

}


/* =========================================
   ROUND LÖSCHEN
   ========================================= */

async function deleteRound(
    round
) {

    const confirmed =
        window.confirm(
            `Delete Round ${round.round_number}?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("rounds")
            .delete()
            .eq(
                "id",
                round.id
            );


    if (error) {

        console.error(
            "Round could not be deleted:",
            error
        );


        showStatus(
            `Round could not be deleted: ${error.message}`,
            true
        );


        return;

    }


    rounds =
        rounds.filter(
            item =>
                item.id !== round.id
        );


    renderRounds();


    showStatus(
        "Round deleted."
    );

}


/* =========================================
   COURSE DROPDOWNS
   ========================================= */

function updateCourseDropdowns() {

    renderRounds();

}


/* =========================================
   PLAYERS LADEN
   ========================================= */

async function loadPlayers() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("players")
            .select("*")
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Players could not be loaded:",
            error
        );


        showStatus(
            `Players could not be loaded: ${error.message}`,
            true
        );


        return;

    }


    players =
        data || [];


    renderPlayers();

}


/* =========================================
   PLAYERS RENDERN
   ========================================= */

function renderPlayers() {

    playersBody.innerHTML =
        "";


    playersEmpty.style.display =
        players.length === 0
            ? "block"
            : "none";


    players.forEach(
        (
            player,
            index
        ) => {

            playersBody.appendChild(
                createPlayerRow(
                    player,
                    index
                )
            );

        }
    );

}


/* =========================================
   PLAYER ZEILE
   ========================================= */

function createPlayerRow(
    player,
    index
) {

    const row =
        document.createElement(
            "tr"
        );


    /* NUMBER */

    const numberCell =
        document.createElement(
            "td"
        );


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "player-number";


    number.textContent =
        index + 1;


    numberCell.appendChild(
        number
    );


    row.appendChild(
        numberCell
    );


    /* FIRST NAME */

    row.appendChild(
        createPlayerInputCell(
            player,
            "player_firstname",
            "First name"
        )
    );


    /* SURNAME */

    row.appendChild(
        createPlayerInputCell(
            player,
            "player_surname",
            "Surname"
        )
    );


    /* COUNTRY */

    row.appendChild(
        createPlayerInputCell(
            player,
            "player_country",
            "Country"
        )
    );


    /* HCP */

    const hcpCell =
        document.createElement(
            "td"
        );


    const hcpInput =
        document.createElement(
            "input"
        );


    hcpInput.type =
        "number";


    hcpInput.step =
        "0.1";


    hcpInput.className =
        "player-input player-hcp";


    hcpInput.value =
        player.player_hcp ?? "";


    hcpInput.placeholder =
        "HCP";


    hcpInput.addEventListener(
        "change",
        () => {

            const value =
                hcpInput.value === ""
                    ? null
                    : Number(
                        hcpInput.value
                    );


            updatePlayerField(
                player.id,
                "player_hcp",
                value
            );

        }
    );


    hcpCell.appendChild(
        hcpInput
    );


    row.appendChild(
        hcpCell
    );


    /* =====================================
       TEE
       ===================================== */

    const teeCell =
        document.createElement(
            "td"
        );


    const teeSelect =
        document.createElement(
            "select"
        );


    teeSelect.className =
        "player-input player-tee";


    /*
     * Leere Auswahl.
     */

    const emptyOption =
        document.createElement(
            "option"
        );


    emptyOption.value =
        "";


    emptyOption.textContent =
        "Select tee...";


    teeSelect.appendChild(
        emptyOption
    );


    /*
     * Die vier erlaubten Enum-Werte.
     */

    PLAYER_TEES.forEach(
        tee => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                tee;


            option.textContent =
                TEE_LABELS[tee];


            if (
                player.player_tee === tee
            ) {

                option.selected =
                    true;

            }


            teeSelect.appendChild(
                option
            );

        }
    );


    teeSelect.addEventListener(
        "change",
        () => {

            updatePlayerField(
                player.id,
                "player_tee",
                teeSelect.value === ""
                    ? null
                    : teeSelect.value
            );

        }
    );


    teeCell.appendChild(
        teeSelect
    );


    row.appendChild(
        teeCell
    );


    /* DELETE */

    const actionCell =
        document.createElement(
            "td"
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-button";


    deleteButton.textContent =
        "×";


    deleteButton.title =
        "Delete player";


    deleteButton.addEventListener(
        "click",
        () => {

            deletePlayer(
                player
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        actionCell
    );


    return row;

}


/* =========================================
   PLAYER TEXT INPUT
   ========================================= */

function createPlayerInputCell(
    player,
    column,
    placeholder
) {

    const cell =
        document.createElement(
            "td"
        );


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.className =
        "player-input";


    input.value =
        player[column] || "";


    input.placeholder =
        placeholder;


    input.addEventListener(
        "change",
        () => {

            updatePlayerField(
                player.id,
                column,
                input.value.trim()
            );

        }
    );


    cell.appendChild(
        input
    );


    return cell;

}


/* =========================================
   PLAYER HINZUFÜGEN
   ========================================= */

async function addPlayer() {

    const newPlayer = {

        player_firstname:
            "",

        player_surname:
            "",

        player_country:
            "",

        player_hcp:
            null,

        player_tee:
            null

    };


    const {
        data,
        error
    } =
        await supabaseClient
            .from("players")
            .insert([
                newPlayer
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Player could not be created:",
            error
        );


        showStatus(
            `Player could not be created: ${error.message}`,
            true
        );


        return;

    }


    players.push(
        data
    );


    renderPlayers();


    /*
     * Erstes Eingabefeld der neuen Zeile
     * automatisch fokussieren.
     */

    const rows =
        playersBody.querySelectorAll(
            "tr"
        );


    const lastRow =
        rows[rows.length - 1];


    if (lastRow) {

        const firstInput =
            lastRow.querySelector(
                "input"
            );


        if (firstInput) {

            firstInput.focus();

        }

    }


    showStatus(
        "Player added."
    );

}


/* =========================================
   PLAYER ÄNDERN
   ========================================= */

async function updatePlayerField(
    playerId,
    column,
    value
) {

    const {
        error
    } =
        await supabaseClient
            .from("players")
            .update({

                [column]:
                    value

            })
            .eq(
                "id",
                playerId
            );


    if (error) {

        console.error(
            "Player could not be updated:",
            error
        );


        showStatus(
            `Player could not be updated: ${error.message}`,
            true
        );


        return;

    }


    const player =
        players.find(
            item =>
                item.id === playerId
        );


    if (player) {

        player[column] =
            value;

    }


    showStatus(
        "Player updated."
    );

}


/* =========================================
   PLAYER LÖSCHEN
   ========================================= */

async function deletePlayer(
    player
) {

    const fullName =
        [
            player.player_firstname,
            player.player_surname
        ]
        .filter(Boolean)
        .join(" ");


    const confirmed =
        window.confirm(
            `Delete ${
                fullName ||
                "this player"
            }?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("players")
            .delete()
            .eq(
                "id",
                player.id
            );


    if (error) {

        console.error(
            "Player could not be deleted:",
            error
        );


        showStatus(
            `Player could not be deleted: ${error.message}`,
            true
        );


        return;

    }


    players =
        players.filter(
            item =>
                item.id !== player.id
        );


    renderPlayers();


    showStatus(
        "Player deleted."
    );

}

/* =========================================
   FLIGHTS LADEN
   ========================================= */

async function loadFlights() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("flights")
            .select("*")
            .order(
                "flight_number",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Flights could not be loaded:",
            error
        );


        showStatus(
            `Flights could not be loaded: ${error.message}`,
            true
        );


        flights = [];

        renderFlights();

        return;

    }


    flights =
        data || [];


    renderFlights();

}


/* =========================================
   FLIGHTS RENDERN
   ========================================= */

function renderFlights() {

    if (!flightsBody) {
        return;
    }


    flightsBody.innerHTML =
        "";


    if (flightsEmpty) {

        flightsEmpty.style.display =
            flights.length === 0
                ? "block"
                : "none";

    }


    flights.forEach(
        flight => {

            flightsBody.appendChild(
                createFlightRow(
                    flight
                )
            );

        }
    );

}


/* =========================================
   FLIGHT ZEILE ERZEUGEN
   ========================================= */

function createFlightRow(
    flight
) {

    const row =
        document.createElement(
            "tr"
        );


    /* =====================================
       FLIGHT NUMBER
       ===================================== */

    const numberCell =
        document.createElement(
            "td"
        );


    const flightName =
        document.createElement(
            "span"
        );


    flightName.className =
        "round-name";


    flightName.textContent =
        `Flight ${flight.flight_number}`;


    numberCell.appendChild(
        flightName
    );


    row.appendChild(
        numberCell
    );


    /* =====================================
       PLAYER 1-4
       ===================================== */

    for (
        let position = 1;
        position <= 4;
        position++
    ) {

        const cell =
            document.createElement(
                "td"
            );


        const select =
            createFlightPlayerSelect(
                flight,
                position
            );


        cell.appendChild(
            select
        );


        row.appendChild(
            cell
        );

    }


    /* =====================================
       STATUS
       ===================================== */

    const statusCell =
        document.createElement(
            "td"
        );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "round-status";


    const assignedPlayers =
        [
            flight.player_1,
            flight.player_2,
            flight.player_3,
            flight.player_4
        ]
        .filter(
            playerId =>
                playerId !== null &&
                playerId !== undefined &&
                playerId !== ""
        );


    if (
        assignedPlayers.length === 0
    ) {

        status.textContent =
            "Empty";

    }

    else {

        status.textContent =
            `${assignedPlayers.length}/4 players`;

    }


    statusCell.appendChild(
        status
    );


    row.appendChild(
        statusCell
    );


    /* =====================================
       DELETE
       ===================================== */

    const actionCell =
        document.createElement(
            "td"
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-button";


    deleteButton.textContent =
        "×";


    deleteButton.title =
        "Delete flight";


    deleteButton.addEventListener(
        "click",
        () => {

            deleteFlight(
                flight
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        actionCell
    );


    return row;

}


/* =========================================
   PLAYER DROPDOWN FÜR FLIGHT
   ========================================= */

function createFlightPlayerSelect(
    flight,
    position
) {

    const select =
        document.createElement(
            "select"
        );


    select.className =
        "course-select";


    const currentPlayerId =
        flight[
            `player_${position}`
        ];


    /* -------------------------------------
       LEERE OPTION
       ------------------------------------- */

    const emptyOption =
        document.createElement(
            "option"
        );


    emptyOption.value =
        "";


    emptyOption.textContent =
        "Select player...";


    select.appendChild(
        emptyOption
    );


    /* -------------------------------------
       BEREITS VERGEBENE SPIELER
       ------------------------------------- */

    const assignedToOtherFlight =
        new Set();


    flights.forEach(
        otherFlight => {

            if (
                otherFlight.id ===
                flight.id
            ) {

                return;

            }


            [
                otherFlight.player_1,
                otherFlight.player_2,
                otherFlight.player_3,
                otherFlight.player_4
            ]
            .forEach(
                playerId => {

                    if (
                        playerId !== null &&
                        playerId !== undefined &&
                        playerId !== ""
                    ) {

                        assignedToOtherFlight.add(
                            String(playerId)
                        );

                    }

                }
            );

        }
    );


    /* -------------------------------------
       SPIELER
       ------------------------------------- */

    players.forEach(
        player => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                player.id;


            const fullName =
                [
                    player.player_firstname,
                    player.player_surname
                ]
                .filter(Boolean)
                .join(" ");


            option.textContent =
                fullName ||
                `Player ${player.id}`;


            /*
             * Der aktuell ausgewählte Spieler
             * bleibt natürlich auswählbar.
             */

            if (
                String(player.id) ===
                String(currentPlayerId)
            ) {

                option.selected =
                    true;

            }


            /*
             * Ein Spieler, der bereits einem
             * anderen Flight zugewiesen ist,
             * kann nicht doppelt vergeben werden.
             */

            else if (
                assignedToOtherFlight.has(
                    String(player.id)
                )
            ) {

                option.disabled =
                    true;

                option.textContent +=
                    " (already assigned)";

            }


            select.appendChild(
                option
            );

        }
    );


    /* -------------------------------------
       ÄNDERUNG SPEICHERN
       ------------------------------------- */

    select.addEventListener(
        "change",
        () => {

            const value =
                select.value === ""
                    ? null
                    : select.value;


            updateFlightPlayer(
                flight.id,
                position,
                value
            );

        }
    );


    return select;

}


/* =========================================
   FLIGHT HINZUFÜGEN
   ========================================= */

async function addFlight() {

    const nextNumber =
        flights.length === 0
            ? 1
            : Math.max(
                ...flights.map(
                    flight =>
                        Number(
                            flight.flight_number
                        ) || 0
                )
            ) + 1;


    const newFlight = {

        flight_number:
            nextNumber,

        player_1:
            null,

        player_2:
            null,

        player_3:
            null,

        player_4:
            null

    };


    const {
        data,
        error
    } =
        await supabaseClient
            .from("flights")
            .insert([
                newFlight
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Flight could not be created:",
            error
        );


        showStatus(
            `Flight could not be created: ${error.message}`,
            true
        );


        return;

    }


    flights.push(
        data
    );


    flights.sort(
        (
            a,
            b
        ) =>
            Number(
                a.flight_number
            ) -
            Number(
                b.flight_number
            )
    );


    renderFlights();


    showStatus(
        `Flight ${nextNumber} added.`
    );

}


/* =========================================
   FLIGHT SPIELER ÄNDERN
   ========================================= */

async function updateFlightPlayer(
    flightId,
    position,
    playerId
) {

    const column =
        `player_${position}`;


    /*
     * Sicherheit:
     * Ein Spieler darf nicht gleichzeitig
     * in zwei verschiedenen Flights sein.
     */

    if (
        playerId !== null
    ) {

        const duplicate =
            flights.some(
                flight => {

                    if (
                        flight.id ===
                        flightId
                    ) {

                        return false;

                    }


                    return [
                        flight.player_1,
                        flight.player_2,
                        flight.player_3,
                        flight.player_4
                    ]
                    .some(
                        existingPlayerId =>
                            String(
                                existingPlayerId
                            ) ===
                            String(
                                playerId
                            )
                    );

                }
            );


        if (duplicate) {

            showStatus(
                "This player is already assigned to another flight.",
                true
            );


            renderFlights();

            return;

        }

    }


    const {
        error
    } =
        await supabaseClient
            .from("flights")
            .update({

                [column]:
                    playerId

            })
            .eq(
                "id",
                flightId
            );


    if (error) {

        console.error(
            "Flight could not be updated:",
            error
        );


        showStatus(
            `Flight could not be updated: ${error.message}`,
            true
        );


        renderFlights();

        return;

    }


    const flight =
        flights.find(
            item =>
                item.id ===
                flightId
        );


    if (flight) {

        flight[column] =
            playerId;

    }


    renderFlights();


    showStatus(
        "Flight updated."
    );

}


/* =========================================
   FLIGHT LÖSCHEN
   ========================================= */

async function deleteFlight(
    flight
) {

    const confirmed =
        window.confirm(
            `Delete Flight ${flight.flight_number}?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("flights")
            .delete()
            .eq(
                "id",
                flight.id
            );


    if (error) {

        console.error(
            "Flight could not be deleted:",
            error
        );


        showStatus(
            `Flight could not be deleted: ${error.message}`,
            true
        );


        return;

    }


    flights =
        flights.filter(
            item =>
                item.id !==
                flight.id
        );


    renderFlights();


    showStatus(
        "Flight deleted."
    );

}


/* =========================================
   MODE
   ========================================= */

function selectMode(
    mode
) {

    selectedMode =
        mode;


    document
        .querySelectorAll(
            ".mode-card"
        )
        .forEach(
            card => {

                card.classList.toggle(
                    "active",
                    card.dataset.mode === mode
                );

            }
        );


    /*
     * Wird weiterhin bewusst nur
     * im Frontend registriert.
     */

    showStatus(
        `Scoring mode: ${mode}`
    );

}


/* =========================================
   STATUS
   ========================================= */

function showStatus(
    message,
    error = false
) {

    if (!globalStatus) {
        return;
    }


    globalStatus.textContent =
        message;


    globalStatus.classList.toggle(
        "error",
        error
    );


    globalStatus.classList.add(
        "show"
    );


    clearTimeout(
        statusTimer
    );


    statusTimer =
        setTimeout(
            () => {

                globalStatus.classList.remove(
                    "show"
                );

            },
            2800
        );

}
