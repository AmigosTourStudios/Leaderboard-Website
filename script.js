
"use strict";


/* =========================================================
   AMIGOS CHALLENGE CUP
   LEADERBOARD + RESULTS

   DATENQUELLEN

   1. TURNIER-SUPABASE
      - courses
      - rounds
      - players

   2. SCORE-SUPABASE
      - scores

   Die Score-Datenbank bleibt bestehen.

   Die bisherige Excel-Datei wird NICHT mehr verwendet.
   ========================================================= */



/* =========================================================
   SUPABASE
   ========================================================= */


/*
 * =========================================================
 * TURNIER-SUPABASE
 *
 * Quelle für:
 *
 * courses
 * rounds
 * players
 * =========================================================
 */

const SUPABASE_URL =
    "https://ylphreyqfcnhmomqsfbe.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_v4zKEbe5ypgXoE_0T8-NBA_c_TLN5Cl";

let tournamentSupabase = null;
let scoreSupabase = null;

let playedScores = {};

/* =========================================================
   TURNIERDATEN
   ========================================================= */


/*
 * courses
 *
 * Enthält die Plätze und deren PAR/HCP-Daten.
 */

let courses = [];


/*
 * rounds
 *
 * Enthält:
 *
 * round_number
 * course_id
 */

let rounds = [];


/*
 * players
 *
 * Wird direkt aus der players-Tabelle aufgebaut.
 */

let players = [];


/*
 * holeData

   Aufbau:

   holeData["1_1"]
   holeData["1_2"]
   ...

   enthält:

   round
   hole
   par
   hcp
 */

let holeData = {};


/*
 * Aktuelle Runde / aktueller Stand.
 */

let currentRound = 1;

let currentThrough = 0;


/*
 * Aktuell ausgewählter Round-Eintrag.
 */

let selectedResultsRound = 1;



/* =========================================================
   DOM
   ========================================================= */

const leaderboardElement =
    document.getElementById(
        "leaderboard"
    );


const resultsContainer =
    document.getElementById(
        "results-container"
    );


const resultsRoundSelect =
    document.getElementById(
        "results-round"
    );


const resultsCourse =
    document.getElementById(
        "results-course"
    );


const roundInfo =
    document.getElementById(
        "round-info"
    );



/* =========================================================
   SUPABASE INITIALISIEREN
   ========================================================= */

function initializeSupabase() {

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "Supabase-Bibliothek wurde nicht geladen."
        );

        return false;
    }


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    /*
     * Alle Tabellen liegen im selben
     * Supabase-Projekt.
     *
     * Beide Variablen zeigen deshalb
     * auf exakt denselben Client.
     */

    tournamentSupabase =
        supabaseClient;

    scoreSupabase =
        supabaseClient;


    console.log(
        "Supabase-Verbindung wurde initialisiert."
    );


    return true;
}



/* =========================================================
   TURNIERDATEN LADEN
   ========================================================= */

async function loadTournamentData() {

    if (
        !tournamentSupabase
    ) {

        throw new Error(
            "Tournament-Supabase ist nicht verfügbar."
        );
    }


    /*
     * -----------------------------------------------------
     * COURSES
     * -----------------------------------------------------
     */

    const {
        data: courseData,
        error: courseError
    } =
        await tournamentSupabase
            .from("courses")
            .select("*")
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (courseError) {

        console.error(
            "Courses konnten nicht geladen werden:",
            courseError
        );

        throw courseError;
    }


    courses =
        courseData || [];


    /*
     * -----------------------------------------------------
     * ROUNDS
     * -----------------------------------------------------
     */

    const {
        data: roundData,
        error: roundError
    } =
        await tournamentSupabase
            .from("rounds")
            .select("*")
            .order(
                "round_number",
                {
                    ascending: true
                }
            );


    if (roundError) {

        console.error(
            "Rounds konnten nicht geladen werden:",
            roundError
        );

        throw roundError;
    }


    rounds =
        roundData || [];


    /*
     * -----------------------------------------------------
     * PLAYERS
     * -----------------------------------------------------
     */

    const {
        data: playerData,
        error: playerError
    } =
        await tournamentSupabase
            .from("players")
            .select("*")
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (playerError) {

        console.error(
            "Players konnten nicht geladen werden:",
            playerError
        );

        throw playerError;
    }


    players =
        (playerData || []).map(
            player => {

                return {

                    ...player,

                    /*
                     * Einheitliche Anzeige.
                     */

                    name:
                        [
                            player.player_firstname,
                            player.player_surname
                        ]
                            .filter(Boolean)
                            .join(" "),

                    country:
                        player.player_country ||
                        "",

                    /*
                     * Für die Score-Zuordnung
                     * behalten wir die echte DB-ID.
                     */

                    tournamentId:
                        player.id,

                    /*
                     * Alte Score-Systeme können ggf.
                     * mit dem Nachnamen arbeiten.
                     */

                    aliases:
                        buildPlayerAliases(
                            player
                        )

                };

            }
        );


    console.log(
        "Courses:",
        courses
    );


    console.log(
        "Rounds:",
        rounds
    );


    console.log(
        "Players:",
        players
    );


    /*
     * Jetzt werden aus den Course-Daten die
     * Hole-Daten aufgebaut.
     */

    buildHoleData();


    /*
     * Rundenauswahl dynamisch erstellen.
     */

    renderRoundSelector();


    /*
     * Kopfbereich aktualisieren.
     */

    updateRoundInfo();
}



/* =========================================================
   PLAYER-ALIASE
   ========================================================= */

function buildPlayerAliases(
    player
) {

    const aliases = [];


    if (
        player.id !== null &&
        player.id !== undefined
    ) {

        aliases.push(
            String(player.id)
        );
    }


    if (
        player.player_firstname
    ) {

        aliases.push(
            String(
                player.player_firstname
            )
                .trim()
                .toLowerCase()
        );
    }


    if (
        player.player_surname
    ) {

        aliases.push(
            String(
                player.player_surname
            )
                .trim()
                .toLowerCase()
        );
    }


    if (
        player.player_firstname &&
        player.player_surname
    ) {

        aliases.push(
            `${player.player_firstname} ${player.player_surname}`
                .trim()
                .toLowerCase()
        );


        aliases.push(
            `${player.player_surname} ${player.player_firstname}`
                .trim()
                .toLowerCase()
        );
    }


    return [
        ...new Set(
            aliases
        )
    ];
}



/* =========================================================
   PLAYER SCORE IDENTIFIZIEREN
   ========================================================= */

function findPlayerByScoreIdentifier(
    identifier
) {

    if (
        identifier === null ||
        identifier === undefined
    ) {

        return null;
    }


    const normalized =
        String(identifier)
            .trim()
            .toLowerCase();


    /*
     * Zuerst exakte Alias-Suche.
     */

    const exact =
        players.find(
            player =>
                player.aliases.includes(
                    normalized
                )
        );


    if (exact) {

        return exact;
    }


    /*
     * Zusätzlich prüfen wir den Nachnamen
     * gegen zusammengesetzte Werte.
     *
     * Das ist wichtig für die bisherige
     * Score-Tabelle, in der beispielsweise
     * "Lenz" statt einer neuen Player-ID
     * gespeichert sein kann.
     */

    return (
        players.find(
            player => {

                const firstName =
                    String(
                        player.player_firstname ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const surname =
                    String(
                        player.player_surname ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    normalized ===
                    surname
                ) ||
                (
                    normalized.includes(
                        surname
                    ) &&
                    surname.length > 0
                ) ||
                (
                    normalized.includes(
                        firstName
                    ) &&
                    firstName.length > 0
                );

            }
        ) ||
        null
    );
}



/* =========================================================
   HOLE-DATEN AUS COURSES AUFBAUEN
   ========================================================= */

function buildHoleData() {

    holeData = {};


    rounds.forEach(
        round => {

            const course =
                courses.find(
                    item =>
                        String(item.id) ===
                        String(round.course_id)
                );


            if (!course) {

                console.warn(
                    `Für Round ${round.round_number} wurde kein Course gefunden.`,
                    round
                );

                return;
            }


            for (
                let hole = 1;
                hole <= 18;
                hole++
            ) {

                const number =
                    String(hole)
                        .padStart(
                            2,
                            "0"
                        );


                const parColumn =
                    `${number}_par`;


                const hcpColumn =
                    `${number}_hcp`;


                const par =
                    getNumericValue(
                        course[parColumn]
                    );


                const hcp =
                    getNumericValue(
                        course[hcpColumn]
                    );


                const key =
                    `${round.round_number}_${hole}`;


                holeData[key] = {

                    round:
                        Number(
                            round.round_number
                        ),

                    hole,

                    par,

                    hcp,

                    courseId:
                        course.id,

                    courseName:
                        course.course_name ||
                        ""

                };

            }

        }
    );


    console.log(
        "Hole-Daten aus Supabase:",
        holeData
    );
}



/* =========================================================
   ZAHL AUS SUPABASE-WERT
   ========================================================= */

function getNumericValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;
}



/* =========================================================
   COURSE EINER RUNDE
   ========================================================= */

function getCourseForRound(
    roundNumber
) {

    const round =
        rounds.find(
            item =>
                Number(
                    item.round_number
                ) ===
                Number(
                    roundNumber
                )
        );


    if (!round) {

        return null;
    }


    return (
        courses.find(
            course =>
                String(course.id) ===
                String(round.course_id)
        ) ||
        null
    );
}



/* =========================================================
   SCORE AUS SUPABASE LADEN
   ========================================================= */

async function loadScoresFromSupabase() {

    if (
        !scoreSupabase
    ) {

        console.error(
            "Score-Supabase ist nicht verbunden."
        );

        return {};
    }


    const {
        data,
        error
    } =
        await scoreSupabase
            .from("scores")
            .select(
                "round, hole, player, score"
            );


    if (error) {

        console.error(
            "Scores konnten nicht geladen werden:",
            error
        );

        return {};
    }


    playedScores = {};


    (data || []).forEach(
        row => {

            const round =
                Number(
                    row.round
                );


            const hole =
                Number(
                    row.hole
                );


            const player =
                findPlayerByScoreIdentifier(
                    row.player
                );


            if (
                !player
            ) {

                console.warn(
                    "Score konnte keinem Spieler zugeordnet werden:",
                    row
                );

                return;
            }


            const score =
                Number(
                    row.score
                );


            if (
                !Number.isFinite(
                    score
                )
            ) {

                return;
            }


            const key =
                `${round}_${hole}_${player.id}`;


            playedScores[key] = score;
        }
    );


    console.log(
    "Scores:",
    playedScores
);

return playedScores;
}



/* =========================================================
   SCORE HOLEN
   ========================================================= */

function getScore(
    round,
    hole,
    playerId
) {

    const key =
        `${round}_${hole}_${playerId}`;


    if (
        playedScores[key] ===
        undefined
    ) {

        return null;
    }


    const score =
        Number(
            playedScores[key]
        );


    return Number.isFinite(
        score
    )
        ? score
        : null;
}



/* =========================================================
   PAR HOLEN
   ========================================================= */

function getPar(
    round,
    hole
) {

    const key =
        `${round}_${hole}`;


    if (
        !holeData[key]
    ) {

        return null;
    }


    return holeData[key].par;
}



/* =========================================================
   HCP DES LOCHS HOLEN
   ========================================================= */

function getHoleHcp(
    round,
    hole
) {

    const key =
        `${round}_${hole}`;


    if (
        !holeData[key]
    ) {

        return null;
    }


    return holeData[key].hcp;
}



/* =========================================================
   SPIELVORGABE DES SPIELERS
   ========================================================= */

/*
 * Berechnet die Spielvorgabe für einen Spieler
 * auf Basis von:
 *
 * HCP
 * Slope des gewählten Abschlags
 * CR des gewählten Abschlags
 * PAR des Platzes
 *
 * Formel:
 *
 * HCP × Slope / 113 - CR + PAR
 */
function getPlayerCourseHandicap(
    round,
    player
) {

    const course =
        getCourseForRound(
            round
        );


    if (
        !course ||
        !player
    ) {

        return null;
    }


    const hcp =
        getNumericValue(
            player.player_hcp
        );


    if (
        hcp === null
    ) {

        return null;
    }


    const tee =
        String(
            player.player_tee ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        tee === ""
    ) {

        return null;
    }


    const teeConfig = {

        yellow: {
            slope: "slope_yellow",
            cr: "cr_yellow"
        },

        white: {
            slope: "slope_white",
            cr: "cr_white"
        },

        blue: {
            slope: "slope_blue",
            cr: "cr_blue"
        },

        red: {
            slope: "slope_red",
            cr: "cr_red"
        }

    };


    const config =
        teeConfig[tee];


    if (
        !config
    ) {

        console.warn(
            `Unbekannter Abschlag "${player.player_tee}" für ${player.name}.`
        );

        return null;
    }


    const slope =
        getNumericValue(
            course[
                config.slope
            ]
        );


    const cr =
        getNumericValue(
            course[
                config.cr
            ]
        );


    /*
     * Das Platz-PAR wird aus den
     * 18 Loch-PAR-Werten des Courses
     * berechnet.
     */
    let coursePar = 0;


    for (
        let hole = 1;
        hole <= 18;
        hole++
    ) {

        const number =
            String(
                hole
            )
                .padStart(
                    2,
                    "0"
                );


        const par =
            getNumericValue(
                course[
                    `${number}_par`
                ]
            );


        if (
            par !== null
        ) {

            coursePar += par;
        }

    }


    if (
        slope === null ||
        cr === null ||
        coursePar === 0
    ) {

        return null;
    }


    const rawCourseHandicap =
        (
            hcp *
            slope /
            113
        ) -
        cr +
        coursePar;


    /*
     * Die Spielvorgabe muss als
     * ganze Zahl auf die Löcher
     * verteilt werden.
     */
    return Math.round(
        rawCourseHandicap
    );

}


/* =========================================================
 * SPV FÜR EIN KONKRETES LOCH
 * =========================================================
 *
 * Gibt zurück, wie viele Vorgabeschläge
 * der Spieler auf diesem Loch erhält.
 *
 * Beispiel:
 *
 * SpV 7:
 * HCP 1–7 = 1 Schlag
 * HCP 8–18 = 0 Schläge
 *
 * SpV 23:
 * HCP 1–5 = 2 Schläge
 * HCP 6–18 = 1 Schlag
 */
/* =========================================================
   SPV FÜR EIN KONKRETES LOCH
   ========================================================= */

/*
 * Gibt zurück, wie viele Vorgabeschläge
 * der Spieler auf diesem Loch erhält.
 *
 * Beispiel:
 *
 * SpV 7:
 * HCP 1–7  = 1 Schlag
 * HCP 8–18 = 0 Schläge
 *
 * SpV 23:
 * HCP 1–5  = 2 Schläge
 * HCP 6–18 = 1 Schlag
 */
function getSpv(
    round,
    hole,
    playerId
) {

    const holeKey =
        `${round}_${hole}`;

    const holeInfo =
        holeData[
            holeKey
        ];

    if (
        !holeInfo
    ) {

        return null;
    }


    const player =
        players.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    playerId
                )
        );

    if (
        !player
    ) {

        return null;
    }


    const courseHandicap =
        getPlayerCourseHandicap(
            round,
            player
        );

    if (
        courseHandicap === null
    ) {

        return null;
    }


    /*
     * Die berechnete Course-SpV kann
     * bei einem Plus-Handicap negativ sein.
     *
     * Beispiel:
     *
     * berechnete SpV = -19
     *
     * Tatsächliche Spielvorgabe:
     *
     * +19
     *
     * Deshalb wird für die
     * Lochverteilung immer der
     * absolute Wert verwendet.
     */

    const strokesTotal =
        Math.abs(
            courseHandicap
        );


    /*
     * SpV 0:
     *
     * Kein Vorgabeschlag.
     */

    if (
        strokesTotal === 0
    ) {

        return 0;
    }


    /*
     * Erste 18 Vorgabeschläge:
     *
     * Jeder Schlag wird einmal
     * auf HCP 1–18 verteilt.
     *
     * Beispiel:
     *
     * SpV 18
     *
     * HCP 1–18 = jeweils 1 Schlag
     */

    const fullRounds =
        Math.floor(
            strokesTotal / 18
        );


    /*
     * Restliche Vorgabeschläge:
     *
     * Diese gehen auf die
     * niedrigsten HCP-Indizes.
     *
     * Beispiel SpV 19:
     *
     * HCP 1 = 2 Schläge
     * HCP 2–18 = 1 Schlag
     */

    const remainder =
        strokesTotal %
        18;


    let strokes =
        fullRounds;


    if (
        holeInfo.hcp <=
        remainder
    ) {

        strokes++;
    }


    return strokes;
}


/* =========================================================
   BRUTTO STABLEFORD
   ========================================================= */

function calculateGrossStableford(
    score,
    par
) {

    if (
        score === null ||
        par === null
    ) {

        return 0;
    }


    const points =
        2 -
        (
            score -
            par
        );


    return Math.max(
        0,
        points
    );
}



/* =========================================================
   NETTO STABLEFORD
   ========================================================= */

function calculateNetStableford(
    score,
    par,
    spv
) {

    /*
     * Solange die SpV noch nicht aus HCP
     * und Course berechnet wird, wird
     * kein Netto-Wert erfunden.
     */

    if (
        score === null ||
        par === null ||
        spv === null
    ) {

        return null;
    }


    const netPar =
        par +
        spv;


    const points =
        2 -
        (
            score -
            netPar
        );


    return Math.max(
        0,
        points
    );
}



/* =========================================================
   LWS
   =========================================================

   Dynamisch für beliebig viele Spieler.

   Voraussetzung:
   Für ein Loch müssen alle Turnierspieler
   einen Score haben.

   Alleine gewonnen:
       2 Punkte

   Geteilter Sieg:
       jeder Sieger 1 Punkt
   ========================================================= */

function calculateLwsForHole(
    scores
) {

    if (
        !scores ||
        scores.length === 0
    ) {

        return null;
    }


    if (
        scores.some(
            score =>
                score === null
        )
    ) {

        return null;
    }


    const lowest =
        Math.min(
            ...scores
        );


    const winners =
        scores.filter(
            score =>
                score === lowest
        ).length;


    if (
        winners === 1
    ) {

        return scores.map(
            score =>
                score === lowest
                    ? 2
                    : 0
        );
    }


    return scores.map(
        score =>
            score === lowest
                ? 1
                : 0
    );
}



/* =========================================================
   SPIELERWERTE ZURÜCKSETZEN
   ========================================================= */

function resetPlayerTotals() {

    players.forEach(
        player => {

            player.totalShots =
                0;

            player.totalPar =
                0;

            player.scoreToPar =
                0;

            player.totalGrossStableford =
                0;

            player.totalNetStableford =
                0;

            player.totalLws =
                0;

            player.playedHoles =
                0;

            player.netHoles =
                0;

            player.rankingPoints =
                0;

        }
    );
}



/* =========================================================
   LEADERBOARD BERECHNEN
   ========================================================= */

/* =========================================================
   LEADERBOARD BERECHNEN
   ========================================================= */

function calculateLeaderboardData() {

    resetPlayerTotals();


    /*
     * Alle vorhandenen Runden durchlaufen.
     */
    rounds.forEach(
        roundData => {

            const round =
                Number(
                    roundData.round_number
                );


            for (
                let hole = 1;
                hole <= 18;
                hole++
            ) {

                const par =
                    getPar(
                        round,
                        hole
                    );


                if (
                    par === null
                ) {

                    continue;
                }


                /*
                 * Scores aller Spieler für dieses Loch.
                 *
                 * Wichtig:
                 * Jeder Spieler wird unabhängig
                 * von den anderen Spielern berechnet.
                 */
                const scores =
                    players.map(
                        player =>
                            getScore(
                                round,
                                hole,
                                player.id
                            )
                    );


                /*
                 * =====================================================
                 * SPIELERWERTE
                 *
                 * Jeder Spieler bekommt seinen Score sofort angerechnet.
                 *
                 * Ein fehlender Score bei einem anderen Spieler
                 * verhindert die Berechnung NICHT.
                 * =====================================================
                 */

                players.forEach(
                    (
                        player,
                        index
                    ) => {

                        const score =
                            scores[index];


                        /*
                         * Spieler hat dieses Loch
                         * noch nicht gespielt.
                         */
                        if (
                            score === null
                        ) {

                            return;
                        }


                        /*
                         * BRUTTO
                         */
                        player.totalShots +=
                            score;


                        player.totalPar +=
                            par;


                        player.playedHoles++;


                        /*
                         * BRUTTO STABLEFORD
                         */
                        player.totalGrossStableford +=
                            calculateGrossStableford(
                                score,
                                par
                            );


                        /*
                         * NETTO STABLEFORD
                         */
                        const spv =
                            getSpv(
                                round,
                                hole,
                                player.id
                            );


                        const netPoints =
                            calculateNetStableford(
                                score,
                                par,
                                spv
                            );


                        if (
                            netPoints !== null
                        ) {

                            player.totalNetStableford +=
                                netPoints;


                            player.netHoles++;
                        }

                    }
                );


                /*
                 * =====================================================
                 * LWS
                 *
                 * LWS wird weiterhin NUR berechnet,
                 * wenn alle Spieler für dieses Loch
                 * einen Score haben.
                 *
                 * calculateLwsForHole() liefert bei fehlenden
                 * Scores bereits null zurück.
                 * =====================================================
                 */

                const lws =
                    calculateLwsForHole(
                        scores
                    );


                if (
                    lws
                ) {

                    players.forEach(
                        (
                            player,
                            index
                        ) => {

                            player.totalLws +=
                                lws[index];

                        }
                    );

                }

            }

        }
    );


    /*
     * =====================================================
     * SCORE ZU PAR
     * =====================================================
     */

    players.forEach(
        player => {

            if (
                player.playedHoles === 0
            ) {

                player.scoreToPar =
                    0;

                return;
            }


            player.scoreToPar =
                player.totalShots -
                player.totalPar;

        }
    );


    /*
     * =====================================================
     * GESAMT-WERTUNG
     *
     * 1. Brutto zu PAR
     * 2. LWS
     * 3. Netto STB
     * 4. Brutto STB
     *
     * Der Netto-Punkt wird nur berücksichtigt,
     * wenn tatsächlich SpV-Daten vorhanden sind.
     * =====================================================
     */

    const playersWithScores =
        players.filter(
            player =>
                player.playedHoles > 0
        );


    /*
     * =====================================================
     * 1. BRUTTO ZU PAR
     * =====================================================
     */

    if (
        playersWithScores.length > 0
    ) {

        const bestScoreToPar =
            Math.min(
                ...playersWithScores.map(
                    player =>
                        player.scoreToPar
                )
            );


        playersWithScores.forEach(
            player => {

                if (
                    player.scoreToPar ===
                    bestScoreToPar
                ) {

                    player.rankingPoints++;

                }

            }
        );

    }


    /*
     * =====================================================
     * 2. LWS
     * =====================================================
     */

    if (
        playersWithScores.length > 0
    ) {

        const bestLws =
            Math.max(
                ...playersWithScores.map(
                    player =>
                        player.totalLws
                )
            );


        playersWithScores.forEach(
            player => {

                if (
                    player.totalLws ===
                    bestLws
                ) {

                    player.rankingPoints++;

                }

            }
        );

    }


    /*
     * =====================================================
     * 3. NETTO STABLEFORD
     *
     * Nur Spieler mit tatsächlichen
     * Netto-Werten werden berücksichtigt.
     * =====================================================
     */

    const playersWithNet =
        playersWithScores.filter(
            player =>
                player.netHoles > 0
        );


    if (
        playersWithNet.length > 0
    ) {

        const bestNetStableford =
            Math.max(
                ...playersWithNet.map(
                    player =>
                        player.totalNetStableford
                )
            );


        playersWithNet.forEach(
            player => {

                if (
                    player.totalNetStableford ===
                    bestNetStableford
                ) {

                    player.rankingPoints++;

                }

            }
        );

    }


    /*
     * =====================================================
     * 4. BRUTTO STABLEFORD
     * =====================================================
     */

    if (
        playersWithScores.length > 0
    ) {

        const bestGrossStableford =
            Math.max(
                ...playersWithScores.map(
                    player =>
                        player.totalGrossStableford
                )
            );


        playersWithScores.forEach(
            player => {

                if (
                    player.totalGrossStableford ===
                    bestGrossStableford
                ) {

                    player.rankingPoints++;

                }

            }
        );

    }


    /*
     * =====================================================
     * SORTIERUNG
     * =====================================================
     */

    players.sort(
        (
            a,
            b
        ) => {

            /*
             * 1. Wertungspunkte
             */

            if (
                a.rankingPoints !==
                b.rankingPoints
            ) {

                return (
                    b.rankingPoints -
                    a.rankingPoints
                );

            }


            /*
             * 2. Brutto zu PAR
             */

            if (
                a.scoreToPar !==
                b.scoreToPar
            ) {

                return (
                    a.scoreToPar -
                    b.scoreToPar
                );

            }


            /*
             * 3. LWS
             */

            if (
                a.totalLws !==
                b.totalLws
            ) {

                return (
                    b.totalLws -
                    a.totalLws
                );

            }


            /*
             * 4. Netto Stableford
             */

            if (
                a.totalNetStableford !==
                b.totalNetStableford
            ) {

                return (
                    b.totalNetStableford -
                    a.totalNetStableford
                );

            }


            /*
             * 5. Brutto Stableford
             */

            if (
                a.totalGrossStableford !==
                b.totalGrossStableford
            ) {

                return (
                    b.totalGrossStableford -
                    a.totalGrossStableford
                );

            }


            return 0;

        }
    );

}

function getPlayerThroughHole(playerId) {

    let lastRound = 0;
    let lastHole = 0;

    rounds.forEach(
        roundData => {

            const round =
                Number(
                    roundData.round_number
                );

            for (
                let hole = 1;
                hole <= 18;
                hole++
            ) {

                const score =
                    getScore(
                        round,
                        hole,
                        playerId
                    );

                if (
                    score !== null
                ) {

                    if (
                        round > lastRound ||
                        (
                            round === lastRound &&
                            hole > lastHole
                        )
                    ) {

                        lastRound =
                            round;

                        lastHole =
                            hole;

                    }

                }

            }

        }
    );

    return lastHole > 0
        ? lastHole
        : null;
}


/* =========================================================
   AKTUELLEN TURNIERSTAND ERMITTELN
   ========================================================= */

function updateRoundInfo() {

    if (
        rounds.length === 0
    ) {

        if (roundInfo) {

            roundInfo.textContent =
                "NO ROUNDS CONFIGURED";

        }

        return;
    }


    let lastRound =
        Number(
            rounds[0].round_number
        );


    let lastHole = 0;


    /*
     * Wir prüfen die Runden in der
     * tatsächlichen Turnierstruktur.
     */

    rounds.forEach(
        roundData => {

            const round =
                Number(
                    roundData.round_number
                );


            for (
                let hole = 1;
                hole <= 18;
                hole++
            ) {

                const scores =
                    players.map(
                        player =>
                            getScore(
                                round,
                                hole,
                                player.id
                            )
                    );


                const complete =
                    scores.length > 0 &&
                    scores.every(
                        score =>
                            score !== null
                    );


                if (
                    complete
                ) {

                    lastRound =
                        round;

                    lastHole =
                        hole;

                }

            }

        }
    );


    currentRound =
        lastRound;


    currentThrough =
        lastHole;


    const course =
        getCourseForRound(
            currentRound
        );


    const courseName =
        course?.course_name ||
        "COURSE";


    if (
        !roundInfo
    ) {

        return;
    }


    if (
        currentThrough > 0
    ) {

        roundInfo.textContent =
            `ROUND ${currentRound} | ${courseName} `;

    }

    else {

        roundInfo.textContent =
            `ROUND ${currentRound} | ${courseName}`;

    }

}



/* =========================================================
   SCORE FORMATIEREN
   ========================================================= */

function formatScoreToPar(
    score,
    playedHoles
) {

    if (
        playedHoles === 0
    ) {

        return "–";
    }


    if (
        score === 0
    ) {

        return "E";
    }


    if (
        score > 0
    ) {

        return `+${score}`;
    }


    return `${score}`;
}



/* =========================================================
   LEADERBOARD LEEREN
   ========================================================= */

function clearLeaderboard() {

    if (
        !leaderboardElement
    ) {

        return null;
    }


    leaderboardElement.innerHTML =
        "";


    return leaderboardElement;
}



/* =========================================================
LEADERBOARD RENDERN
========================================================= */

function renderLeaderboard() {

    const leaderboard =
        clearLeaderboard();


    if (
        !leaderboard
    ) {

        return;
    }


    if (
        players.length === 0
    ) {

        leaderboard.innerHTML = `
            <div class="leaderboard-empty">
                NO PLAYERS CONFIGURED
            </div>
        `;

        return;
    }


    players.forEach(
        (
            player,
            index
        ) => {

            const playerRow =
                document.createElement(
                    "article"
                );


            playerRow.className =
                "player-row";


            const netValue =
                player.netHoles > 0
                    ? player.totalNetStableford
                    : "–";


            playerRow.innerHTML = `

                <div class="rank">
                    ${index + 1}
                </div>


                <div class="player-info">

                    <div
                        class="player-name-line"
                        style="
                            display:flex;
                            align-items:baseline;
                            justify-content:flex-start;
                            gap:8px;
                        "
                    >

                        <div class="player-name">
                            ${player.name}
                        </div>

                        <div
                            class="player-country"
                            style="
                                flex:0 0 auto;
                            "
                        >
                            ${player.country}
                        </div>

                    </div>


                    <div
                        class="player-through"
                        style="
                            font-size:0.72em;
                            line-height:1.1;
                            margin-top:2px;
                        "
                    >
                        ${
                            getPlayerThroughHole(
                                player.id
                            ) !== null
                                ? `THR ${getPlayerThroughHole(player.id)}`
                                : ""
                        }
                    </div>

                </div>


                <div class="score-over-par">

                    ${formatScoreToPar(
                        player.scoreToPar,
                        player.playedHoles
                    )}

                </div>


                <div class="stats">


                    <div class="stat">

                        <span class="stat-label">
                            NETTO
                        </span>

                        <span class="stat-value">
                            ${netValue}
                        </span>

                    </div>


                    <div class="stat">

                        <span class="stat-label">
                            BRUTTO
                        </span>

                        <span class="stat-value">

                            ${
                                player.playedHoles > 0
                                    ? player.totalGrossStableford
                                    : "–"
                            }

                        </span>

                    </div>


                    <div class="stat">

                        <span class="stat-label">
                            LWS
                        </span>

                        <span class="stat-value">

                            ${
                                player.playedHoles > 0
                                    ? player.totalLws
                                    : "–"
                            }

                        </span>

                    </div>


                </div>

            `;


            leaderboard.appendChild(
                playerRow
            );

        }
    );

}



/* =========================================================
   SCORECARD STYLING
   ========================================================= */

function getScoreClass(
    score,
    par
) {

    if (
        score === null ||
        par === null
    ) {

        return "";
    }


    const difference =
        score -
        par;


    if (
        difference <= -2
    ) {

        return "circle-2";
    }


    if (
        difference === -1
    ) {

        return "circle-1";
    }


    if (
        difference === 1
    ) {

        return "square-1";
    }


    if (
        difference >= 2
    ) {

        return "square-2";
    }


    return "";
}



/* =========================================================
   SCORECARD SCORE DARSTELLEN
   ========================================================= */

function renderScoreValue(
    score,
    par
) {

    if (
        score === null
    ) {

        return "";
    }


    const className =
        getScoreClass(
            score,
            par
        );


    if (
        className === ""
    ) {

        return `
            <span class="score-value">
                ${score}
            </span>
        `;
    }


    return `
        <span class="score-value ${className}">
            ${score}
        </span>
    `;
}



/* =========================================================
   SCORECARD
   ========================================================= */

function renderPlayerScorecard(
    player,
    round
) {

    let frontPar = 0;
    let backPar = 0;


    let frontScore = 0;
    let backScore = 0;


    let frontGross = 0;
    let backGross = 0;


    let html = `

        <article class="result-player-card">


            <div class="result-player-name">
                ${escapeHtml(
                    player.name
                )}
            </div>


            <div class="scorecard-scroll">


                <table class="scorecard">


                    <thead>

                        <tr>

                            <th class="row-label">
                                HOLE
                            </th>
    `;


    /*
     * Löcher 1–9
     */

    for (
        let hole = 1;
        hole <= 9;
        hole++
    ) {

        html += `
            <th>
                ${hole}
            </th>
        `;

    }


    html += `
            <th class="section-total">
                OUT
            </th>
    `;


    /*
     * Löcher 10–18
     */

    for (
        let hole = 10;
        hole <= 18;
        hole++
    ) {

        html += `
            <th>
                ${hole}
            </th>
        `;

    }


    html += `

            <th class="section-total">
                IN
            </th>

            <th class="total-column">
                TOT
            </th>

        </tr>

    </thead>


    <tbody>


        <tr class="par-row">


            <td class="row-label">
                PAR
            </td>

    `;


    /*
     * PAR 1–9
     */

    for (
        let hole = 1;
        hole <= 9;
        hole++
    ) {

        const par =
            getPar(
                round,
                hole
            );


        if (
            par !== null
        ) {

            frontPar +=
                par;

        }


        html += `
            <td>
                ${
                    par !== null
                        ? par
                        : ""
                }
            </td>
        `;

    }


    html += `

            <td class="section-total">
                ${frontPar}
            </td>

    `;


    /*
     * PAR 10–18
     */

    for (
        let hole = 10;
        hole <= 18;
        hole++
    ) {

        const par =
            getPar(
                round,
                hole
            );


        if (
            par !== null
        ) {

            backPar +=
                par;

        }


        html += `
            <td>
                ${
                    par !== null
                        ? par
                        : ""
                }
            </td>
        `;

    }


    const totalPar =
        frontPar +
        backPar;


    html += `

            <td class="section-total">
                ${backPar}
            </td>

            <td class="total-column">
                ${totalPar}
            </td>

        </tr>


        <tr>


            <td class="row-label">
                SCORE
            </td>

    `;


    /*
     * SCORE 1–9
     */

    for (
        let hole = 1;
        hole <= 9;
        hole++
    ) {

        const score =
            getScore(
                round,
                hole,
                player.id
            );


        const par =
            getPar(
                round,
                hole
            );


        if (
            score !== null
        ) {

            frontScore +=
                score;


            frontGross +=
                calculateGrossStableford(
                    score,
                    par
                );

        }


        html += `

            <td>

                ${renderScoreValue(
                    score,
                    par
                )}

            </td>

        `;

    }


    html += `

            <td class="section-total">

                ${
                    frontScore > 0
                        ? frontScore
                        : ""
                }

            </td>

    `;


    /*
     * SCORE 10–18
     */

    for (
        let hole = 10;
        hole <= 18;
        hole++
    ) {

        const score =
            getScore(
                round,
                hole,
                player.id
            );


        const par =
            getPar(
                round,
                hole
            );


        if (
            score !== null
        ) {

            backScore +=
                score;


            backGross +=
                calculateGrossStableford(
                    score,
                    par
                );

        }


        html += `

            <td>

                ${renderScoreValue(
                    score,
                    par
                )}

            </td>

        `;

    }


    const totalScore =
        frontScore +
        backScore;


    html += `

            <td class="section-total">

                ${
                    backScore > 0
                        ? backScore
                        : ""
                }

            </td>


            <td class="total-column">

                ${
                    totalScore > 0
                        ? totalScore
                        : ""
                }

            </td>


        </tr>


        <tr>


            <td class="row-label">
                STB
            </td>

    `;


    /*
     * STABLEFORD 1–9
     */

    for (
        let hole = 1;
        hole <= 9;
        hole++
    ) {

        const score =
            getScore(
                round,
                hole,
                player.id
            );


        const par =
            getPar(
                round,
                hole
            );


        const points =
            calculateGrossStableford(
                score,
                par
            );


        html += `

            <td>

                ${
                    score !== null
                        ? points
                        : ""
                }

            </td>

        `;

    }


    html += `

            <td class="section-total">

                ${
                    frontScore > 0
                        ? frontGross
                        : ""
                }

            </td>

    `;


    /*
     * STABLEFORD 10–18
     */

    for (
        let hole = 10;
        hole <= 18;
        hole++
    ) {

        const score =
            getScore(
                round,
                hole,
                player.id
            );


        const par =
            getPar(
                round,
                hole
            );


        const points =
            calculateGrossStableford(
                score,
                par
            );


        html += `

            <td>

                ${
                    score !== null
                        ? points
                        : ""
                }

            </td>

        `;

    }


    const totalGross =
        frontGross +
        backGross;


    html += `

            <td class="section-total">

                ${
                    backScore > 0
                        ? backGross
                        : ""
                }

            </td>


            <td class="total-column">

                ${
                    totalGross > 0
                        ? totalGross
                        : ""
                }

            </td>


        </tr>


    </tbody>


</table>


</div>


<div class="result-summary">


    <div class="result-summary-item">

        <span class="result-summary-label">
            PAR
        </span>

        <span class="result-summary-value">
            ${totalPar}
        </span>

    </div>


    <div class="result-summary-item">

        <span class="result-summary-label">
            BRUTTO
        </span>

        <span class="result-summary-value">

            ${
                totalScore > 0
                    ? totalScore
                    : "–"
            }

        </span>

    </div>


    <div class="result-summary-item">

        <span class="result-summary-label">
            BRUTTO STB
        </span>

        <span class="result-summary-value">

            ${
                totalGross > 0
                    ? totalGross
                    : "–"
            }

        </span>

    </div>


</div>


</article>

    `;


    return html;
}



/* =========================================================
   RESULTS RUNDENAUSWAHL
   ========================================================= */

function renderRoundSelector() {

    if (
        !resultsRoundSelect
    ) {

        return;
    }


    const previousValue =
        resultsRoundSelect.value;


    resultsRoundSelect.innerHTML =
        "";


    rounds.forEach(
        round => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                round.round_number;


            const course =
                getCourseForRound(
                    round.round_number
                );


            const courseName =
                course?.course_name ||
                "No Course";


            option.textContent =
                `ROUND ${round.round_number} | ${courseName}`;


            resultsRoundSelect.appendChild(
                option
            );

        }
    );


    /*
     * Vorherige Auswahl beibehalten,
     * wenn sie noch existiert.
     */

    if (
        [...resultsRoundSelect.options]
            .some(
                option =>
                    option.value ===
                    previousValue
            )
    ) {

        resultsRoundSelect.value =
            previousValue;

    }

    else if (
        rounds.length > 0
    ) {

        resultsRoundSelect.value =
            rounds[0].round_number;

    }


    selectedResultsRound =
        Number(
            resultsRoundSelect.value
        );

}



/* =========================================================
   RESULTS RENDERN
   ========================================================= */

function renderResults() {

    if (
        !resultsContainer
    ) {

        return;
    }


    if (
        rounds.length === 0
    ) {

        resultsContainer.innerHTML = `

            <div class="results-empty">
                NO ROUNDS CONFIGURED
            </div>

        `;

        if (
            resultsCourse
        ) {

            resultsCourse.textContent =
                "NO ROUNDS CONFIGURED";

        }

        return;
    }


    const round =
        Number(
            resultsRoundSelect.value
        );


    selectedResultsRound =
        round;


    const course =
        getCourseForRound(
            round
        );


    if (
        resultsCourse
    ) {

        resultsCourse.textContent =
            `ROUND ${round} | ${
                course?.course_name ||
                "NO COURSE"
            }`;

    }


    resultsContainer.innerHTML =
        "";


    /*
     * Alphabetische Darstellung der
     * Scorecards.
     *
     * Die Leaderboard-Reihenfolge
     * bleibt davon unberührt.
     */

    const sortedPlayers =
        [...players].sort(
            (
                a,
                b
            ) => {

                const surnameA =
                    String(
                        a.player_surname ||
                        ""
                    );


                const surnameB =
                    String(
                        b.player_surname ||
                        ""
                    );


                return surnameA.localeCompare(
                    surnameB,
                    "de"
                );

            }
        );


    sortedPlayers.forEach(
        player => {

            resultsContainer.innerHTML +=
                renderPlayerScorecard(
                    player,
                    round
                );

        }
    );

}



/* =========================================================
   ALLES AKTUALISIEREN
   ========================================================= */

async function updateAll() {

    try {

        /*
         * Scores neu laden.
         */

        playedScores =
            await loadScoresFromSupabase();


        /*
         * Leaderboard neu berechnen.
         */

        calculateLeaderboardData();


        /*
         * Darstellung aktualisieren.
         */

        renderLeaderboard();


        updateRoundInfo();


        renderResults();

    }

    catch (
        error
    ) {

        console.error(
            "Update fehlgeschlagen:",
            error
        );

    }

}



/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navLeaderboard =
        document.getElementById(
            "nav-leaderboard"
        );


    const navResults =
        document.getElementById(
            "nav-results"
        );


    const navNews =
        document.getElementById(
            "nav-news"
        );


    const leaderboardSection =
        document.getElementById(
            "leaderboard-section"
        );


    const resultsSection =
        document.getElementById(
            "results-section"
        );


    const newsSection =
        document.getElementById(
            "news-section"
        );


    if (
        !navLeaderboard ||
        !navResults ||
        !navNews ||
        !leaderboardSection ||
        !resultsSection ||
        !newsSection
    ) {

        console.error(
            "Navigationselemente fehlen."
        );

        return;
    }


    function showPage(
        page
    ) {

        leaderboardSection.classList.add(
            "hidden"
        );


        resultsSection.classList.add(
            "hidden"
        );


        newsSection.classList.add(
            "hidden"
        );


        navLeaderboard.classList.remove(
            "active"
        );


        navResults.classList.remove(
            "active"
        );


        navNews.classList.remove(
            "active"
        );


        if (
            page ===
            "leaderboard"
        ) {

            leaderboardSection.classList.remove(
                "hidden"
            );


            navLeaderboard.classList.add(
                "active"
            );

        }


        if (
            page ===
            "results"
        ) {

            resultsSection.classList.remove(
                "hidden"
            );


            navResults.classList.add(
                "active"
            );


            renderResults();

        }


        if (
            page ===
            "news"
        ) {

            newsSection.classList.remove(
                "hidden"
            );


            navNews.classList.add(
                "active"
            );


            loadNews();

        }

    }


    navLeaderboard.addEventListener(
        "click",
        () => {

            showPage(
                "leaderboard"
            );

        }
    );


    navResults.addEventListener(
        "click",
        () => {

            showPage(
                "results"
            );

        }
    );


    navNews.addEventListener(
        "click",
        () => {

            showPage(
                "news"
            );

        }
    );


    if (
        resultsRoundSelect
    ) {

        resultsRoundSelect.addEventListener(
            "change",
            () => {

                renderResults();

            }
        );

    }

}



/* =========================================================
   NEWS
   ========================================================= */

async function loadNews() {

    const container =
        document.getElementById(
            "news-container"
        );


    if (
        !container
    ) {

        return;
    }


    /*
     * News liegt weiterhin in der
     * bisherigen Score/News-Supabase.
     */


    const {
        data: news,
        error: newsError
    } =
        await scoreSupabase
            .from("news")
            .select(
                "id, created_at, title, content, published"
            )
            .eq(
                "published",
                true
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (
        newsError
    ) {

        console.error(
            "News konnten nicht geladen werden:",
            newsError
        );


        container.innerHTML = `

            <div class="news-empty">
                News konnten nicht geladen werden.
            </div>

        `;


        return;
    }


    container.innerHTML =
        "";


    if (
        !news ||
        news.length === 0
    ) {

        container.innerHTML = `

            <div class="news-empty">
                Noch keine News vorhanden.
            </div>

        `;


        return;
    }


    for (
        const post of news
    ) {

        const {
            data: media,
            error: mediaError
        } =
            await scoreSupabase
                .from("news_media")
                .select(
                    "id, news_id, storage_path, media_type, created_at"
                )
                .eq(
                    "news_id",
                    post.id
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (
            mediaError
        ) {

            console.error(
                "News-Media konnte nicht geladen werden:",
                mediaError
            );

        }


        const article =
            document.createElement(
                "article"
            );


        article.className =
            "news-item";


        const date =
            new Date(
                post.created_at
            );


        const formattedDate =
            date
                .toLocaleDateString(
                    "de-DE",
                    {
                        day:
                            "2-digit",

                        month:
                            "short",

                        year:
                            "numeric"
                    }
                )
                .toUpperCase();


        const formattedTime =
            date
                .toLocaleTimeString(
                    "de-DE",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
                    }
                );


        article.innerHTML = `

            <div class="news-date">

                ${formattedDate}
                |
                ${formattedTime}
                UHR

            </div>


            <div class="news-content">


                <div class="news-text-content">

                    <h2 class="news-title">

                        ${escapeHtml(
                            post.title
                        )}

                    </h2>


                    <p class="news-text">

                        ${escapeHtml(
                            post.content
                        )}

                    </p>

                </div>


            </div>

        `;


        const newsContent =
            article.querySelector(
                ".news-content"
            );


        const imageMedia =
            media?.find(
                mediaItem =>
                    mediaItem.media_type ===
                    "image"
            );


        if (
            imageMedia &&
            newsContent
        ) {

            const {
                data:
                    publicUrlData
            } =
                scoreSupabase
                    .storage
                    .from(
                        "news-media"
                    )
                    .getPublicUrl(
                        imageMedia.storage_path
                    );


            const imageUrl =
                publicUrlData?.publicUrl;


            if (
                imageUrl
            ) {

                const mediaContainer =
                    document.createElement(
                        "div"
                    );


                mediaContainer.className =
                    "news-media";


                const image =
                    document.createElement(
                        "img"
                    );


                image.className =
                    "news-image";


                image.src =
                    imageUrl;


                image.alt =
                    post.title ||
                    "News Bild";


                image.loading =
                    "lazy";


                mediaContainer.appendChild(
                    image
                );


                newsContent.appendChild(
                    mediaContainer
                );

            }

        }


        container.appendChild(
            article
        );

    }

}



/* =========================================================
   HTML SICHERHEIT
   ========================================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ??
        "";


    return div.innerHTML;
}



/* =========================================================
   LIGHTBOX
   ========================================================= */

function openImageLightbox(
    imageUrl,
    altText
) {

    const existing =
        document.querySelector(
            ".image-lightbox"
        );


    if (
        existing
    ) {

        existing.remove();

    }


    const lightbox =
        document.createElement(
            "div"
        );


    lightbox.className =
        "image-lightbox";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        imageUrl;


    image.alt =
        altText ||
        "News Bild";


    lightbox.appendChild(
        image
    );


    document.body.appendChild(
        lightbox
    );


    lightbox.addEventListener(
        "click",
        () => {

            lightbox.remove();

        }
    );


    image.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );


    function closeWithEscape(
        event
    ) {

        if (
            event.key ===
            "Escape"
        ) {

            lightbox.remove();


            document.removeEventListener(
                "keydown",
                closeWithEscape
            );

        }

    }


    document.addEventListener(
        "keydown",
        closeWithEscape
    );

}



/* =========================================================
   NEWS-BILDER
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const image =
            event.target.closest(
                ".news-image"
            );


        if (
            !image
        ) {

            return;
        }


        event.preventDefault();


        openImageLightbox(
            image.src,
            image.alt
        );

    }
);



/* =========================================================
   AUTOMATISCHE AKTUALISIERUNG
   ========================================================= */

setInterval(
    async () => {

        /*
         * Turnierstruktur ebenfalls
         * regelmäßig neu laden.
         *
         * Dadurch werden neue Spieler,
         * Runden oder Course-Änderungen
         * automatisch übernommen.
         */

        try {

            await loadTournamentData();

            await updateAll();

        }

        catch (
            error
        ) {

            console.error(
                "Automatische Aktualisierung fehlgeschlagen:",
                error
            );

        }

    },
    5000
);



/* =========================================================
   START
   ========================================================= */

(async function () {

    try {

        /*
         * 1. Supabase-Verbindungen
         */

        const connected =
            initializeSupabase();


        if (
            !connected
        ) {

            return;
        }


        /*
         * 2. Navigation
         */

        setupNavigation();


        /*
         * 3. Turnierstruktur laden
         */

        await loadTournamentData();


        /*
         * 4. Scores laden
         */

        playedScores =
            await loadScoresFromSupabase();


        /*
         * 5. Berechnung
         */

        calculateLeaderboardData();


        /*
         * 6. Darstellung
         */

        renderLeaderboard();


        updateRoundInfo();


        renderResults();


        console.log(
            "Leaderboard-Anwendung vollständig gestartet."
        );

    }

    catch (
        error
    ) {

        console.error(
            "Anwendung konnte nicht gestartet werden:",
            error
        );


        if (
            leaderboardElement
        ) {

            leaderboardElement.innerHTML = `

                <div class="leaderboard-empty">

                    TURNIERDATEN KONNTEN NICHT GELADEN WERDEN

                </div>

            `;

        }

    }

})();

