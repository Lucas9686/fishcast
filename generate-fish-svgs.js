/**
 * Fish SVG Generator - Creates SVG illustrations for all 62 fish species
 * Run with: node generate-fish-svgs.js
 */
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'images', 'fish');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================
// Fish body shape templates (SVG path data)
// ============================================================
const BODY_SHAPES = {
    // Standard fish shape (perch, trout, bass)
    standard: {
        body: 'M 60,125 Q 40,105 50,85 Q 65,55 120,45 Q 180,35 240,50 Q 300,65 330,100 Q 340,115 340,125 Q 340,135 330,150 Q 300,185 240,200 Q 180,215 120,205 Q 65,195 50,165 Q 40,145 60,125 Z',
        eye: { cx: 95, cy: 110, r: 10 },
        dorsalFin: 'M 160,50 Q 170,15 200,10 Q 230,15 250,25 Q 260,35 270,50 Q 240,45 210,42 Q 180,42 160,50 Z',
        tailFin: 'M 330,100 Q 355,65 380,50 Q 370,80 365,100 Q 365,125 Q 365,150 370,170 Q 355,185 330,150 Q 335,125 330,100 Z',
        analFin: 'M 240,200 Q 250,220 270,230 Q 280,225 290,210 Q 275,205 260,200 Z',
        pelvicFin: 'M 150,195 Q 155,215 170,225 Q 175,215 165,200 Z',
        pectoralFin: 'M 100,145 Q 80,165 75,185 Q 90,175 110,160 Z',
        mouth: 'M 55,115 Q 45,118 42,125 Q 45,132 55,135'
    },
    // Elongated predator (pike, zander)
    elongated: {
        body: 'M 40,120 Q 30,108 35,95 Q 50,70 100,60 Q 160,50 230,55 Q 300,60 345,85 Q 360,100 360,125 Q 360,150 345,165 Q 300,190 230,195 Q 160,200 100,190 Q 50,180 35,155 Q 30,142 40,130 Z',
        eye: { cx: 75, cy: 112, r: 9 },
        dorsalFin: 'M 260,58 Q 270,25 290,18 Q 310,22 330,35 Q 340,50 345,65 Q 320,58 295,55 Q 270,55 260,58 Z',
        tailFin: 'M 355,95 Q 375,60 395,45 Q 385,75 380,95 L 380,125 L 380,155 Q 385,175 395,205 Q 375,190 355,155 Q 358,125 355,95 Z',
        analFin: 'M 260,195 Q 268,218 285,225 Q 300,218 310,195 Q 290,192 270,192 Z',
        pelvicFin: 'M 155,190 Q 158,210 170,220 Q 176,210 170,195 Z',
        pectoralFin: 'M 90,140 Q 70,158 65,178 Q 80,170 100,155 Z',
        mouth: 'M 38,108 Q 22,112 18,125 Q 22,138 38,142'
    },
    // Deep body (bream, carp)
    deep: {
        body: 'M 70,125 Q 55,100 65,70 Q 85,35 140,22 Q 200,15 250,30 Q 300,50 325,90 Q 338,115 338,130 Q 338,145 325,175 Q 300,210 250,230 Q 200,245 140,238 Q 85,225 65,190 Q 55,160 70,135 Z',
        eye: { cx: 105, cy: 100, r: 10 },
        dorsalFin: 'M 145,22 Q 160,-10 190,-15 Q 220,-8 250,5 Q 270,18 280,30 Q 250,22 220,18 Q 185,17 145,22 Z',
        tailFin: 'M 335,110 Q 358,70 380,55 Q 372,85 368,110 L 368,140 L 368,170 Q 372,195 380,210 Q 358,195 335,155 Q 337,132 335,110 Z',
        analFin: 'M 230,232 Q 240,255 260,262 Q 275,255 280,238 Q 262,235 245,232 Z',
        pelvicFin: 'M 150,225 Q 155,248 170,258 Q 178,248 172,230 Z',
        pectoralFin: 'M 100,150 Q 78,170 72,195 Q 90,185 108,165 Z',
        mouth: 'M 65,112 Q 50,118 48,128 Q 52,138 68,140'
    },
    // Eel-like (aal, aalrutte)
    eel: {
        body: 'M 30,115 Q 25,108 30,100 Q 50,85 100,80 Q 180,75 260,78 Q 330,82 370,100 Q 385,110 385,125 Q 385,140 370,150 Q 330,168 260,172 Q 180,175 100,170 Q 50,165 30,150 Q 25,142 30,135 Z',
        eye: { cx: 60, cy: 108, r: 7 },
        dorsalFin: 'M 180,78 Q 185,65 200,60 Q 250,58 300,62 Q 340,68 365,80 Q 340,76 300,74 Q 250,72 200,73 Q 185,75 180,78 Z',
        tailFin: 'M 380,108 Q 395,98 400,105 Q 400,125 Q 400,145 395,152 Q 380,142 380,125 Z',
        analFin: 'M 200,172 Q 205,182 230,186 Q 280,188 330,182 Q 360,175 370,165 Q 340,170 300,174 Q 250,176 210,174 Z',
        pelvicFin: '',
        pectoralFin: 'M 70,135 Q 55,148 52,162 Q 65,155 78,142 Z',
        mouth: 'M 28,108 Q 18,112 15,118 Q 18,128 28,132'
    },
    // Flat fish (scholle, flunder)
    flat: {
        body: 'M 60,115 Q 50,105 55,90 Q 70,70 120,58 Q 180,48 250,55 Q 310,65 345,90 Q 358,105 358,125 Q 358,145 345,160 Q 310,185 250,195 Q 180,202 120,192 Q 70,180 55,160 Q 50,145 60,135 Z',
        eye: { cx: 90, cy: 95, r: 9 },
        dorsalFin: 'M 80,62 Q 85,48 100,42 Q 150,32 220,30 Q 280,35 320,48 Q 340,58 345,70 Q 310,58 250,50 Q 180,45 120,50 Q 90,56 80,62 Z',
        tailFin: 'M 352,100 Q 372,75 388,62 Q 382,88 378,105 L 378,145 Q 382,162 388,188 Q 372,175 352,150 Q 354,125 352,100 Z',
        analFin: 'M 90,190 Q 95,205 120,212 Q 180,220 250,215 Q 310,205 340,188 Q 310,195 250,200 Q 180,205 120,200 Q 95,196 90,190 Z',
        pelvicFin: '',
        pectoralFin: 'M 95,140 Q 75,155 70,172 Q 85,165 100,150 Z',
        mouth: 'M 55,108 Q 42,112 38,120 Q 42,130 55,132'
    },
    // Torpedo/streamlined (mackerel, tuna)
    torpedo: {
        body: 'M 45,125 Q 35,112 42,98 Q 60,68 120,52 Q 190,40 260,48 Q 320,58 350,88 Q 362,108 362,125 Q 362,142 350,162 Q 320,192 260,202 Q 190,210 120,198 Q 60,182 42,152 Q 35,138 45,125 Z',
        eye: { cx: 85, cy: 110, r: 9 },
        dorsalFin: 'M 150,52 Q 158,20 180,12 Q 200,18 215,30 Q 225,42 230,52 Q 210,48 190,45 Q 170,45 150,52 Z',
        tailFin: 'M 358,100 Q 380,55 398,38 Q 390,72 385,100 L 385,125 L 385,150 Q 390,178 398,212 Q 380,195 358,150 Q 360,125 358,100 Z',
        analFin: 'M 250,202 Q 256,222 270,228 Q 282,222 285,205 Q 272,202 260,202 Z',
        pelvicFin: 'M 155,195 Q 158,212 168,218 Q 175,210 170,198 Z',
        pectoralFin: 'M 95,145 Q 72,168 65,190 Q 82,178 100,158 Z',
        mouth: 'M 42,112 Q 28,118 25,125 Q 28,132 42,138'
    },
    // Cephalopod (squid, octopus)
    cephalopod: {
        body: 'M 200,40 Q 240,35 260,50 Q 280,70 285,100 Q 285,130 275,155 Q 260,175 240,180 Q 220,182 200,180 Q 180,178 160,175 Q 140,155 135,130 Q 135,100 140,70 Q 155,50 175,40 Q 190,38 200,40 Z',
        eye: { cx: 185, cy: 100, r: 12 },
        dorsalFin: '',
        tailFin: '',
        analFin: '',
        pelvicFin: '',
        pectoralFin: '',
        mouth: '',
        tentacles: [
            'M 175,180 Q 140,220 120,250 Q 110,265 105,280',
            'M 190,182 Q 160,225 145,260 Q 138,278 135,290',
            'M 205,183 Q 200,230 195,265 Q 192,280 190,295',
            'M 220,182 Q 240,225 250,260 Q 255,278 258,290',
            'M 235,178 Q 270,215 288,248 Q 295,262 300,278',
            'M 165,178 Q 125,210 105,238 Q 95,252 88,268',
            'M 245,170 Q 285,200 305,228 Q 315,245 320,260',
            'M 155,172 Q 110,195 85,220 Q 72,235 65,252'
        ]
    },
    // Catfish (wels)
    catfish: {
        body: 'M 50,120 Q 35,105 40,88 Q 55,60 110,48 Q 180,38 260,48 Q 330,62 355,95 Q 365,112 365,128 Q 365,145 355,165 Q 330,198 260,212 Q 180,222 110,212 Q 55,200 40,172 Q 35,155 50,140 Z',
        eye: { cx: 82, cy: 98, r: 7 },
        dorsalFin: 'M 160,48 Q 168,22 180,18 Q 192,22 198,38 Q 195,42 185,45 Q 175,46 165,48 Z',
        tailFin: 'M 360,105 Q 378,72 392,58 Q 386,88 382,108 L 382,148 Q 386,172 392,202 Q 378,188 360,155 Q 362,130 360,105 Z',
        analFin: 'M 180,218 Q 185,235 210,240 Q 260,242 310,235 Q 340,225 352,210 Q 330,218 290,225 Q 240,228 200,222 Z',
        pelvicFin: 'M 155,210 Q 158,228 168,235 Q 176,228 172,215 Z',
        pectoralFin: 'M 95,150 Q 68,175 60,200 Q 80,190 100,168 Z',
        mouth: 'M 42,108 Q 28,115 22,125 Q 28,140 42,145',
        barbels: [
            'M 45,105 Q 20,85 5,75 Q 10,70 30,80',
            'M 48,100 Q 25,78 12,65 Q 18,62 35,75',
            'M 42,140 Q 30,155 25,165',
            'M 45,145 Q 35,158 32,168'
        ]
    }
};

// ============================================================
// Fish species definitions
// ============================================================
const FISH_DATA = [
    // RAUBFISCH
    { id: 'hecht', name: 'Hecht', shape: 'elongated', bodyColor: '#5a7247', bodyGrad: '#3d5230', bellyColor: '#d4c9a0', spotColor: '#4a6038', finColor: '#6b8a55', spots: 'streaks', bgGrad: ['#2a4a3a', '#1a3028'] },
    { id: 'zander', name: 'Zander', shape: 'elongated', bodyColor: '#7a8a6a', bodyGrad: '#5a6a4a', bellyColor: '#c8c0a0', spotColor: '#5a6a4a', finColor: '#6a7a5a', spots: 'bars', bgGrad: ['#2a3a4a', '#1a2838'] },
    { id: 'flussbarsch', name: 'Flussbarsch', shape: 'standard', bodyColor: '#5a7a3a', bodyGrad: '#3a5a2a', bellyColor: '#e0d8a0', spotColor: '#2a3a1a', finColor: '#d45030', spots: 'bars', bgGrad: ['#2a4a3a', '#1a3828'] },
    { id: 'wels', name: 'Wels', shape: 'catfish', bodyColor: '#4a5a4a', bodyGrad: '#2a3a2a', bellyColor: '#a0a890', spotColor: '#3a4a3a', finColor: '#5a6a5a', spots: 'mottled', bgGrad: ['#2a3a2a', '#1a2818'] },
    { id: 'rapfen', name: 'Rapfen', shape: 'torpedo', bodyColor: '#8a9aaa', bodyGrad: '#6a7a8a', bellyColor: '#d8dce0', spotColor: '#7a8a9a', finColor: '#8090a0', spots: 'none', bgGrad: ['#2a4a5a', '#1a3848'] },
    { id: 'aalrutte', name: 'Aalrutte', shape: 'eel', bodyColor: '#6a6040', bodyGrad: '#4a4028', bellyColor: '#b8b090', spotColor: '#5a5030', finColor: '#7a7050', spots: 'mottled', bgGrad: ['#2a3028', '#1a2018'] },
    { id: 'aal', name: 'Aal', shape: 'eel', bodyColor: '#3a4a3a', bodyGrad: '#1a2a1a', bellyColor: '#a0a890', spotColor: '#2a3a2a', finColor: '#4a5a4a', spots: 'none', bgGrad: ['#1a2a28', '#0a1a18'] },
    { id: 'kaulbarsch', name: 'Kaulbarsch', shape: 'standard', bodyColor: '#7a8a5a', bodyGrad: '#5a6a3a', bellyColor: '#c8c0a0', spotColor: '#5a6a3a', finColor: '#8a9a6a', spots: 'dots', bgGrad: ['#2a4a3a', '#1a3028'] },

    // SALMONIDE
    { id: 'bachforelle', name: 'Bachforelle', shape: 'standard', bodyColor: '#7a8a50', bodyGrad: '#5a6a38', bellyColor: '#e8c860', spotColor: '#c03020', finColor: '#b8a040', spots: 'trout', bgGrad: ['#2a4a4a', '#183838'] },
    { id: 'regenbogenforelle', name: 'Regenbogenforelle', shape: 'standard', bodyColor: '#6a8a7a', bodyGrad: '#4a6a5a', bellyColor: '#d8d0c0', spotColor: '#2a2a2a', finColor: '#8a7a8a', spots: 'trout', rainbow: true, bgGrad: ['#2a4a5a', '#183848'] },
    { id: 'seeforelle', name: 'Seeforelle', shape: 'standard', bodyColor: '#8a9a9a', bodyGrad: '#6a7a7a', bellyColor: '#d8dce0', spotColor: '#2a2a2a', finColor: '#7a8a8a', spots: 'trout', bgGrad: ['#2a3a4a', '#182838'] },
    { id: 'bachsaibling', name: 'Bachsaibling', shape: 'standard', bodyColor: '#4a6a5a', bodyGrad: '#2a4a3a', bellyColor: '#e8a040', spotColor: '#c84030', finColor: '#e86840', spots: 'trout', bgGrad: ['#2a4a4a', '#183838'] },
    { id: 'seesaibling', name: 'Seesaibling', shape: 'standard', bodyColor: '#5a7a8a', bodyGrad: '#3a5a6a', bellyColor: '#e08848', spotColor: '#c84830', finColor: '#d87040', spots: 'trout', bgGrad: ['#1a3a4a', '#0a2838'] },
    { id: 'aesche', name: 'Aesche', shape: 'standard', bodyColor: '#8a9a8a', bodyGrad: '#6a7a6a', bellyColor: '#c8c8c0', spotColor: '#5a6a5a', finColor: '#7a5a8a', spots: 'none', bgGrad: ['#2a4a4a', '#183838'], largeDorsal: true },
    { id: 'huchen', name: 'Huchen', shape: 'elongated', bodyColor: '#8a6a5a', bodyGrad: '#6a4a3a', bellyColor: '#d8c0b0', spotColor: '#5a3a2a', finColor: '#a07060', spots: 'dots', bgGrad: ['#2a3a3a', '#182828'] },
    { id: 'renke', name: 'Renke', shape: 'standard', bodyColor: '#8a9aaa', bodyGrad: '#6a7a8a', bellyColor: '#e0e4e8', spotColor: '#7a8a9a', finColor: '#8a9aa0', spots: 'none', bgGrad: ['#2a3a5a', '#182848'] },

    // FRIEDFISCH
    { id: 'karpfen', name: 'Karpfen', shape: 'deep', bodyColor: '#8a7a40', bodyGrad: '#6a5a28', bellyColor: '#d8c880', spotColor: '#7a6a30', finColor: '#9a8a50', spots: 'none', bgGrad: ['#3a4a2a', '#283818'] },
    { id: 'schleie', name: 'Schleie', shape: 'deep', bodyColor: '#4a6a3a', bodyGrad: '#2a4a1a', bellyColor: '#8a9a60', spotColor: '#3a5a2a', finColor: '#5a7a4a', spots: 'none', bgGrad: ['#2a4a2a', '#183818'] },
    { id: 'barbe', name: 'Barbe', shape: 'standard', bodyColor: '#8a7a5a', bodyGrad: '#6a5a3a', bellyColor: '#d8c8a0', spotColor: '#7a6a4a', finColor: '#9a6a4a', spots: 'none', bgGrad: ['#3a4a3a', '#283828'] },
    { id: 'nase', name: 'Nase', shape: 'standard', bodyColor: '#7a8a8a', bodyGrad: '#5a6a6a', bellyColor: '#d0d4d8', spotColor: '#6a7a7a', finColor: '#b06040', spots: 'none', bgGrad: ['#2a3a4a', '#182838'] },
    { id: 'brachse', name: 'Brachse', shape: 'deep', bodyColor: '#7a8a7a', bodyGrad: '#5a6a5a', bellyColor: '#c0c8c0', spotColor: '#6a7a6a', finColor: '#5a6a5a', spots: 'none', bgGrad: ['#2a4a3a', '#183828'] },
    { id: 'rotauge', name: 'Rotauge', shape: 'standard', bodyColor: '#8a9a8a', bodyGrad: '#6a7a6a', bellyColor: '#d8dcd8', spotColor: '#7a8a7a', finColor: '#c84030', spots: 'none', bgGrad: ['#2a4a4a', '#183838'] },
    { id: 'rotfeder', name: 'Rotfeder', shape: 'standard', bodyColor: '#7a8a5a', bodyGrad: '#5a6a3a', bellyColor: '#d0d4a8', spotColor: '#6a7a4a', finColor: '#d84030', spots: 'none', bgGrad: ['#2a4a3a', '#183828'] },
    { id: 'doebel', name: 'Doebel', shape: 'standard', bodyColor: '#6a7a6a', bodyGrad: '#4a5a4a', bellyColor: '#c8ccc8', spotColor: '#5a6a5a', finColor: '#8a6a4a', spots: 'none', bgGrad: ['#2a4a3a', '#183828'] },
    { id: 'karausche', name: 'Karausche', shape: 'deep', bodyColor: '#9a8a40', bodyGrad: '#7a6a28', bellyColor: '#d8c870', spotColor: '#8a7a30', finColor: '#a89848', spots: 'none', bgGrad: ['#3a4a2a', '#283818'] },
    { id: 'gruendling', name: 'Gruendling', shape: 'standard', bodyColor: '#7a7a60', bodyGrad: '#5a5a40', bellyColor: '#c8c8b0', spotColor: '#5a5a40', finColor: '#8a8a70', spots: 'dots', bgGrad: ['#2a3a2a', '#182818'], small: true },
    { id: 'hasel', name: 'Hasel', shape: 'standard', bodyColor: '#8a9a8a', bodyGrad: '#6a7a6a', bellyColor: '#d8dcd8', spotColor: '#7a8a7a', finColor: '#7a8a7a', spots: 'none', bgGrad: ['#2a4a3a', '#183828'], small: true },
    { id: 'elritze', name: 'Elritze', shape: 'standard', bodyColor: '#5a7a5a', bodyGrad: '#3a5a3a', bellyColor: '#c8d0c0', spotColor: '#3a5a3a', finColor: '#6a8a6a', spots: 'dots', bgGrad: ['#2a4a3a', '#183828'], small: true },
    { id: 'giebel', name: 'Giebel', shape: 'deep', bodyColor: '#8a8a50', bodyGrad: '#6a6a30', bellyColor: '#c8c890', spotColor: '#7a7a40', finColor: '#8a8a58', spots: 'none', bgGrad: ['#2a3a2a', '#183018'] },
    { id: 'sterlet', name: 'Sterlet', shape: 'elongated', bodyColor: '#5a6a6a', bodyGrad: '#3a4a4a', bellyColor: '#c0c8c8', spotColor: '#4a5a5a', finColor: '#6a7a7a', spots: 'scutes', bgGrad: ['#2a3a4a', '#182838'] },
    { id: 'zingel', name: 'Zingel', shape: 'elongated', bodyColor: '#8a7a50', bodyGrad: '#6a5a30', bellyColor: '#c8c0a0', spotColor: '#6a5a30', finColor: '#8a7a58', spots: 'bars', bgGrad: ['#2a3a2a', '#182818'] },
    { id: 'streber', name: 'Streber', shape: 'elongated', bodyColor: '#7a6a48', bodyGrad: '#5a4a28', bellyColor: '#c0b898', spotColor: '#5a4a28', finColor: '#7a6a50', spots: 'bars', bgGrad: ['#2a3a2a', '#182818'] },
    { id: 'ukelei', name: 'Ukelei', shape: 'standard', bodyColor: '#9aaab0', bodyGrad: '#7a8a90', bellyColor: '#e0e8f0', spotColor: '#8a9aa0', finColor: '#90a0a8', spots: 'none', bgGrad: ['#2a4a5a', '#183848'], small: true },
    { id: 'aland', name: 'Aland', shape: 'standard', bodyColor: '#7a8a6a', bodyGrad: '#5a6a4a', bellyColor: '#d0d4c0', spotColor: '#6a7a5a', finColor: '#c06040', spots: 'none', bgGrad: ['#2a4a3a', '#183828'] },
    { id: 'stint', name: 'Stint', shape: 'standard', bodyColor: '#8a9aa8', bodyGrad: '#6a7a88', bellyColor: '#d8e0e8', spotColor: '#7a8a98', finColor: '#8a9aa0', spots: 'none', bgGrad: ['#2a3a4a', '#182838'], small: true },
    { id: 'koppe', name: 'Koppe', shape: 'catfish', bodyColor: '#6a6a50', bodyGrad: '#4a4a30', bellyColor: '#a8a890', spotColor: '#4a4a30', finColor: '#7a7a60', spots: 'mottled', bgGrad: ['#2a3028', '#1a2018'], small: true },

    // SALZWASSER
    { id: 'meerforelle', name: 'Meerforelle', shape: 'standard', bodyColor: '#8a9aaa', bodyGrad: '#6a7a8a', bellyColor: '#d8e0e8', spotColor: '#2a2a2a', finColor: '#7a8a9a', spots: 'trout', bgGrad: ['#1a3a5a', '#0a2848'] },
    { id: 'lachs', name: 'Lachs', shape: 'torpedo', bodyColor: '#7a8a9a', bodyGrad: '#5a6a7a', bellyColor: '#d8d0c0', spotColor: '#3a3a3a', finColor: '#8a7a7a', spots: 'dots', bgGrad: ['#1a3a5a', '#0a2848'] },
    { id: 'wolfsbarsch', name: 'Wolfsbarsch', shape: 'standard', bodyColor: '#8a9aaa', bodyGrad: '#6a7a8a', bellyColor: '#e0e4e8', spotColor: '#7a8a9a', finColor: '#7a8a9a', spots: 'none', bgGrad: ['#1a3a5a', '#0a2848'] },
    { id: 'goldbrasse', name: 'Goldbrasse', shape: 'deep', bodyColor: '#b0a060', bodyGrad: '#908040', bellyColor: '#e0d890', spotColor: '#a09050', finColor: '#c0b070', spots: 'none', bgGrad: ['#1a3a5a', '#0a2848'] },
    { id: 'zahnbrasse', name: 'Zahnbrasse', shape: 'deep', bodyColor: '#8a90a0', bodyGrad: '#6a7080', bellyColor: '#c8c8d8', spotColor: '#7a8090', finColor: '#8a8a9a', spots: 'none', bgGrad: ['#1a3050', '#0a2040'] },
    { id: 'meerbrasse', name: 'Meerbrasse', shape: 'deep', bodyColor: '#b08880', bodyGrad: '#906860', bellyColor: '#d8c0b8', spotColor: '#a07870', finColor: '#b89088', spots: 'none', bgGrad: ['#1a3050', '#0a2040'] },
    { id: 'makrele', name: 'Makrele', shape: 'torpedo', bodyColor: '#3a6a8a', bodyGrad: '#1a4a6a', bellyColor: '#d8e0e8', spotColor: '#2a5a7a', finColor: '#4a7a9a', spots: 'wavyLines', bgGrad: ['#0a2a4a', '#001838'] },
    { id: 'thunfisch', name: 'Thunfisch', shape: 'torpedo', bodyColor: '#2a4a6a', bodyGrad: '#0a2a4a', bellyColor: '#c8d0d8', spotColor: '#1a3a5a', finColor: '#3a5a7a', spots: 'none', bgGrad: ['#0a2040', '#001030'] },
    { id: 'meeraesche', name: 'Meeraesche', shape: 'standard', bodyColor: '#7a8a8a', bodyGrad: '#5a6a6a', bellyColor: '#d0d8d8', spotColor: '#6a7a7a', finColor: '#6a7a7a', spots: 'stripes', bgGrad: ['#1a3a4a', '#0a2838'] },
    { id: 'hornhecht', name: 'Hornhecht', shape: 'elongated', bodyColor: '#4a8a6a', bodyGrad: '#2a6a4a', bellyColor: '#c0d8c8', spotColor: '#3a7a5a', finColor: '#5a9a7a', spots: 'none', bgGrad: ['#1a3a4a', '#0a2838'] },
    { id: 'dorsch', name: 'Dorsch', shape: 'standard', bodyColor: '#7a7a5a', bodyGrad: '#5a5a3a', bellyColor: '#d0d0c0', spotColor: '#5a5a3a', finColor: '#7a7a5a', spots: 'mottled', bgGrad: ['#1a2a3a', '#0a1828'] },
    { id: 'scholle', name: 'Scholle', shape: 'flat', bodyColor: '#8a7a50', bodyGrad: '#6a5a30', bellyColor: '#c8c0a0', spotColor: '#c84020', finColor: '#8a7a58', spots: 'orangeDots', bgGrad: ['#2a3a3a', '#182828'] },
    { id: 'steinbutt', name: 'Steinbutt', shape: 'flat', bodyColor: '#6a6a5a', bodyGrad: '#4a4a3a', bellyColor: '#b0b0a0', spotColor: '#4a4a3a', finColor: '#6a6a5a', spots: 'mottled', bgGrad: ['#2a3a3a', '#182828'] },
    { id: 'hering', name: 'Hering', shape: 'standard', bodyColor: '#5a7a9a', bodyGrad: '#3a5a7a', bellyColor: '#d8e0e8', spotColor: '#4a6a8a', finColor: '#6a8a9a', spots: 'none', bgGrad: ['#0a2a4a', '#001838'], small: true },
    { id: 'sardine', name: 'Sardine', shape: 'standard', bodyColor: '#4a6a8a', bodyGrad: '#2a4a6a', bellyColor: '#d0d8e0', spotColor: '#3a5a7a', finColor: '#5a7a8a', spots: 'none', bgGrad: ['#0a2a4a', '#001838'], small: true },
    { id: 'rotbarbe', name: 'Rotbarbe', shape: 'standard', bodyColor: '#c06848', bodyGrad: '#a04828', bellyColor: '#e0b098', spotColor: '#b05838', finColor: '#d08060', spots: 'none', bgGrad: ['#1a3040', '#0a2030'] },
    { id: 'seeteufel', name: 'Seeteufel', shape: 'catfish', bodyColor: '#6a5a48', bodyGrad: '#4a3a28', bellyColor: '#a89880', spotColor: '#5a4a38', finColor: '#7a6a58', spots: 'mottled', bgGrad: ['#1a2a2a', '#0a1818'] },
    { id: 'meeraal', name: 'Meeraal', shape: 'eel', bodyColor: '#3a3a3a', bodyGrad: '#1a1a1a', bellyColor: '#808080', spotColor: '#2a2a2a', finColor: '#4a4a4a', spots: 'none', bgGrad: ['#0a1a2a', '#001018'] },
    { id: 'knurrhahn', name: 'Knurrhahn', shape: 'standard', bodyColor: '#c05040', bodyGrad: '#a03020', bellyColor: '#e0a890', spotColor: '#b04030', finColor: '#d06050', spots: 'none', bgGrad: ['#1a2a3a', '#0a1828'] },
    { id: 'bonito', name: 'Bonito', shape: 'torpedo', bodyColor: '#3a5a7a', bodyGrad: '#1a3a5a', bellyColor: '#d0d8e0', spotColor: '#2a4a6a', finColor: '#4a6a8a', spots: 'stripes', bgGrad: ['#0a2040', '#001030'] },
    { id: 'petersfisch', name: 'Petersfisch', shape: 'deep', bodyColor: '#8a8a60', bodyGrad: '#6a6a40', bellyColor: '#c0c0a0', spotColor: '#1a1a1a', finColor: '#8a8a68', spots: 'petersfisch', bgGrad: ['#1a3040', '#0a2030'] },
    { id: 'flunder', name: 'Flunder', shape: 'flat', bodyColor: '#7a7050', bodyGrad: '#5a5030', bellyColor: '#b8b098', spotColor: '#5a5030', finColor: '#7a7058', spots: 'mottled', bgGrad: ['#2a3a3a', '#182828'] },
    { id: 'seezunge', name: 'Seezunge', shape: 'flat', bodyColor: '#7a6a4a', bodyGrad: '#5a4a2a', bellyColor: '#b0a888', spotColor: '#5a4a2a', finColor: '#7a6a50', spots: 'none', bgGrad: ['#2a3a3a', '#182828'] },

    // MEERESFRUECHTE
    { id: 'kalmar', name: 'Kalmar', shape: 'cephalopod', bodyColor: '#8a6880', bodyGrad: '#6a4860', bellyColor: '#c8a8c0', spotColor: '#7a5870', finColor: '#9a7890', spots: 'none', bgGrad: ['#1a2040', '#0a1030'], squid: true },
    { id: 'sepia', name: 'Sepia', shape: 'cephalopod', bodyColor: '#7a6850', bodyGrad: '#5a4830', bellyColor: '#b8a888', spotColor: '#6a5840', finColor: '#8a7860', spots: 'mottled', bgGrad: ['#1a2030', '#0a1020'] },
    { id: 'oktopus', name: 'Oktopus', shape: 'cephalopod', bodyColor: '#8a4848', bodyGrad: '#6a2828', bellyColor: '#c88888', spotColor: '#7a3838', finColor: '#9a5858', spots: 'dots', bgGrad: ['#1a2030', '#0a1020'] }
];

// ============================================================
// SVG Generation
// ============================================================

function generateSpots(fish, bodyPath) {
    let spotsStr = '';
    const opacity = 0.4;

    switch (fish.spots) {
        case 'bars':
            for (let i = 0; i < 6; i++) {
                const x = 120 + i * 35;
                spotsStr += `<line x1="${x}" y1="70" x2="${x - 10}" y2="185" stroke="${fish.spotColor}" stroke-width="5" opacity="${opacity}" stroke-linecap="round"/>`;
            }
            break;
        case 'dots':
            for (let i = 0; i < 15; i++) {
                const x = 90 + Math.random() * 220;
                const y = 75 + Math.random() * 100;
                const r = 2 + Math.random() * 4;
                spotsStr += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fish.spotColor}" opacity="${opacity + 0.1}"/>`;
            }
            break;
        case 'trout':
            // Red and black dots for trout
            for (let i = 0; i < 12; i++) {
                const x = 100 + Math.random() * 200;
                const y = 80 + Math.random() * 80;
                spotsStr += `<circle cx="${x}" cy="${y}" r="${2 + Math.random() * 3}" fill="${fish.spotColor}" opacity="0.6"/>`;
            }
            for (let i = 0; i < 8; i++) {
                const x = 110 + Math.random() * 180;
                const y = 85 + Math.random() * 70;
                spotsStr += `<circle cx="${x}" cy="${y}" r="${1.5 + Math.random() * 2.5}" fill="#c03020" opacity="0.5"/>`;
            }
            break;
        case 'mottled':
            for (let i = 0; i < 20; i++) {
                const x = 80 + Math.random() * 240;
                const y = 70 + Math.random() * 110;
                const rx = 3 + Math.random() * 8;
                const ry = 2 + Math.random() * 5;
                spotsStr += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fish.spotColor}" opacity="${0.2 + Math.random() * 0.2}" transform="rotate(${Math.random() * 60 - 30} ${x} ${y})"/>`;
            }
            break;
        case 'streaks':
            for (let i = 0; i < 8; i++) {
                const x = 100 + i * 30;
                const y1 = 85 + Math.random() * 20;
                const y2 = 140 + Math.random() * 20;
                spotsStr += `<line x1="${x}" y1="${y1}" x2="${x + 5}" y2="${y2}" stroke="${fish.spotColor}" stroke-width="3" opacity="${opacity}" stroke-linecap="round"/>`;
            }
            break;
        case 'stripes':
            for (let i = 0; i < 5; i++) {
                const y = 75 + i * 22;
                spotsStr += `<line x1="90" y1="${y}" x2="320" y2="${y}" stroke="${fish.spotColor}" stroke-width="2" opacity="0.25"/>`;
            }
            break;
        case 'wavyLines':
            for (let i = 0; i < 7; i++) {
                const y = 60 + i * 12;
                spotsStr += `<path d="M 100,${y} Q 140,${y - 5} 180,${y} Q 220,${y + 5} 260,${y} Q 300,${y - 5} 340,${y}" stroke="${fish.spotColor}" stroke-width="2" fill="none" opacity="0.35"/>`;
            }
            break;
        case 'orangeDots':
            for (let i = 0; i < 10; i++) {
                const x = 100 + Math.random() * 210;
                const y = 75 + Math.random() * 90;
                spotsStr += `<circle cx="${x}" cy="${y}" r="${3 + Math.random() * 5}" fill="#e06030" opacity="0.5"/>`;
            }
            break;
        case 'scutes':
            for (let i = 0; i < 8; i++) {
                const x = 100 + i * 30;
                spotsStr += `<path d="M ${x},85 l 5,-8 l 5,8" stroke="${fish.spotColor}" stroke-width="2" fill="none" opacity="0.5"/>`;
                spotsStr += `<path d="M ${x},165 l 5,8 l 5,-8" stroke="${fish.spotColor}" stroke-width="2" fill="none" opacity="0.5"/>`;
            }
            break;
        case 'petersfisch':
            // Characteristic dark spot on the body
            spotsStr += `<circle cx="190" cy="125" r="18" fill="#1a1a1a" opacity="0.6"/>`;
            spotsStr += `<circle cx="190" cy="125" r="22" fill="none" stroke="#3a3a1a" stroke-width="2" opacity="0.4"/>`;
            break;
    }

    return spotsStr;
}

function generateRainbowStripe() {
    return `<linearGradient id="rainbow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="30%" stop-color="#d04080" stop-opacity="0.3"/>
        <stop offset="50%" stop-color="#e06080" stop-opacity="0.4"/>
        <stop offset="70%" stop-color="#d04080" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="transparent"/>
    </linearGradient>`;
}

function generateFishSVG(fish) {
    const shape = BODY_SHAPES[fish.shape];
    if (!shape) return null;

    const bgGrad = fish.bgGrad || ['#2a4a4a', '#183838'];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgGrad[0]}"/>
      <stop offset="100%" stop-color="${bgGrad[1]}"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fish.bodyColor}"/>
      <stop offset="60%" stop-color="${fish.bodyGrad}"/>
      <stop offset="100%" stop-color="${fish.bellyColor}"/>
    </linearGradient>
    <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fish.finColor}"/>
      <stop offset="100%" stop-color="${fish.bodyGrad}"/>
    </linearGradient>`;

    if (fish.rainbow) {
        svg += generateRainbowStripe();
    }

    svg += `
    <clipPath id="bodyClip">
      <path d="${shape.body}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="400" height="250" fill="url(#bg)" rx="8"/>

  <!-- Water shimmer -->
  <g opacity="0.08">
    <path d="M 0,180 Q 50,175 100,180 Q 150,185 200,180 Q 250,175 300,180 Q 350,185 400,180" stroke="#ffffff" stroke-width="1.5" fill="none"/>
    <path d="M 0,200 Q 50,195 100,200 Q 150,205 200,200 Q 250,195 300,200 Q 350,205 400,200" stroke="#ffffff" stroke-width="1" fill="none"/>
    <path d="M 0,220 Q 50,215 100,220 Q 150,225 200,220 Q 250,215 300,220 Q 350,225 400,220" stroke="#ffffff" stroke-width="0.8" fill="none"/>
  </g>`;

    if (fish.shape === 'cephalopod') {
        // Special rendering for cephalopods
        svg += generateCephalopod(fish, shape);
    } else {
        // Standard fish rendering
        // Fins (behind body)
        if (shape.tailFin) {
            svg += `\n  <path d="${shape.tailFin}" fill="url(#finGrad)" opacity="0.85"/>`;
        }
        if (shape.dorsalFin) {
            svg += `\n  <path d="${shape.dorsalFin}" fill="url(#finGrad)" opacity="0.85"/>`;
        }
        if (fish.largeDorsal) {
            // Aesche-style large colorful dorsal
            svg += `\n  <path d="M 145,50 Q 160,5 190,-5 Q 225,0 255,20 Q 272,35 278,48 Q 250,38 220,35 Q 185,35 155,42 Z" fill="#7a5a8a" opacity="0.7"/>`;
        }

        // Body
        svg += `\n  <path d="${shape.body}" fill="url(#bodyGrad)" stroke="${fish.bodyGrad}" stroke-width="1"/>`;

        // Rainbow stripe for Regenbogenforelle
        if (fish.rainbow) {
            svg += `\n  <path d="${shape.body}" fill="url(#rainbow)" clip-path="url(#bodyClip)"/>`;
        }

        // Spots/patterns (clipped to body)
        const spots = generateSpots(fish, shape.body);
        if (spots) {
            svg += `\n  <g clip-path="url(#bodyClip)">${spots}</g>`;
        }

        // Scale texture
        svg += `\n  <path d="${shape.body}" fill="none" stroke="${fish.bodyColor}" stroke-width="0.5" opacity="0.15"/>`;

        // Front fins
        if (shape.pectoralFin) {
            svg += `\n  <path d="${shape.pectoralFin}" fill="url(#finGrad)" opacity="0.75"/>`;
        }
        if (shape.pelvicFin) {
            svg += `\n  <path d="${shape.pelvicFin}" fill="url(#finGrad)" opacity="0.75"/>`;
        }
        if (shape.analFin) {
            svg += `\n  <path d="${shape.analFin}" fill="url(#finGrad)" opacity="0.8"/>`;
        }

        // Barbels for catfish
        if (shape.barbels) {
            shape.barbels.forEach(b => {
                svg += `\n  <path d="${b}" stroke="${fish.bodyGrad}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            });
        }

        // Lateral line
        svg += `\n  <path d="M 90,125 Q 150,122 220,125 Q 290,128 340,125" stroke="${fish.bodyColor}" stroke-width="0.8" fill="none" opacity="0.3" stroke-dasharray="3,3"/>`;

        // Eye
        if (shape.eye) {
            svg += `\n  <circle cx="${shape.eye.cx}" cy="${shape.eye.cy}" r="${shape.eye.r}" fill="#1a1a1a"/>`;
            svg += `\n  <circle cx="${shape.eye.cx}" cy="${shape.eye.cy}" r="${shape.eye.r * 0.7}" fill="#2a3a2a"/>`;
            svg += `\n  <circle cx="${shape.eye.cx - 2}" cy="${shape.eye.cy - 2}" r="${shape.eye.r * 0.25}" fill="#ffffff" opacity="0.8"/>`;
        }

        // Mouth
        if (shape.mouth) {
            svg += `\n  <path d="${shape.mouth}" stroke="${fish.bodyGrad}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
        }

        // Gill slit
        svg += `\n  <path d="M ${(shape.eye?.cx || 90) + 18},${(shape.eye?.cy || 110) - 15} Q ${(shape.eye?.cx || 90) + 15},${(shape.eye?.cy || 110) + 5} ${(shape.eye?.cx || 90) + 20},${(shape.eye?.cy || 110) + 25}" stroke="${fish.bodyGrad}" stroke-width="1.5" fill="none" opacity="0.5"/>`;
    }

    // Fish name label
    svg += `\n  <text x="200" y="242" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#ffffff" opacity="0.5" font-weight="600">${fish.name}</text>`;

    svg += '\n</svg>';
    return svg;
}

function generateCephalopod(fish, shape) {
    let svg = '';

    // Body
    svg += `\n  <path d="${shape.body}" fill="url(#bodyGrad)" stroke="${fish.bodyGrad}" stroke-width="1"/>`;

    // Spots
    const spots = generateSpots(fish, shape.body);
    if (spots) {
        svg += `\n  <g clip-path="url(#bodyClip)">${spots}</g>`;
    }

    // Tentacles
    if (shape.tentacles) {
        shape.tentacles.forEach((t, i) => {
            const opacity = 0.7 + (i % 3) * 0.1;
            svg += `\n  <path d="${t}" stroke="url(#bodyGrad)" stroke-width="${4 - i * 0.2}" fill="none" stroke-linecap="round" opacity="${opacity}"/>`;
            // Suckers
            const parts = t.split(' ');
            if (parts.length > 4) {
                for (let s = 0; s < 3; s++) {
                    const progress = 0.3 + s * 0.25;
                    // Approximate sucker positions along tentacle
                    const sx = 180 + (parseInt(parts[parts.length - 1].split(',')[0]) - 180) * progress;
                    const sy = 180 + (parseInt(parts[parts.length - 1].split(',')[1]) - 180) * progress;
                    svg += `\n  <circle cx="${sx}" cy="${sy}" r="2" fill="${fish.bellyColor}" opacity="0.4"/>`;
                }
            }
        });
    }

    // Side fins for squid
    if (fish.squid) {
        svg += `\n  <path d="M 265,70 Q 300,50 310,70 Q 305,100 285,120" fill="url(#finGrad)" opacity="0.6"/>`;
        svg += `\n  <path d="M 155,70 Q 120,50 110,70 Q 115,100 135,120" fill="url(#finGrad)" opacity="0.6"/>`;
    } else if (fish.id === 'sepia') {
        // Wavy side fins for cuttlefish
        svg += `\n  <path d="M 280,65 Q 300,75 305,95 Q 300,115 295,135 Q 290,155 280,170" stroke="url(#finGrad)" stroke-width="8" fill="none" opacity="0.5"/>`;
        svg += `\n  <path d="M 140,65 Q 120,75 115,95 Q 120,115 125,135 Q 130,155 140,170" stroke="url(#finGrad)" stroke-width="8" fill="none" opacity="0.5"/>`;
    }

    // Eye
    svg += `\n  <circle cx="${shape.eye.cx}" cy="${shape.eye.cy}" r="${shape.eye.r}" fill="#1a1a1a"/>`;
    svg += `\n  <circle cx="${shape.eye.cx}" cy="${shape.eye.cy}" r="${shape.eye.r * 0.6}" fill="#2a3a2a"/>`;
    svg += `\n  <circle cx="${shape.eye.cx - 3}" cy="${shape.eye.cy - 3}" r="${shape.eye.r * 0.2}" fill="#ffffff" opacity="0.8"/>`;
    // Second eye (visible on cephalopods)
    const eyeX2 = 400 - shape.eye.cx + 15;
    svg += `\n  <circle cx="${eyeX2}" cy="${shape.eye.cy}" r="${shape.eye.r}" fill="#1a1a1a"/>`;
    svg += `\n  <circle cx="${eyeX2}" cy="${shape.eye.cy}" r="${shape.eye.r * 0.6}" fill="#2a3a2a"/>`;
    svg += `\n  <circle cx="${eyeX2 - 3}" cy="${shape.eye.cy - 3}" r="${shape.eye.r * 0.2}" fill="#ffffff" opacity="0.8"/>`;

    return svg;
}

// ============================================================
// Generate all SVGs
// ============================================================

console.log(`Generating ${FISH_DATA.length} fish SVGs...`);
let count = 0;

FISH_DATA.forEach(fish => {
    const svg = generateFishSVG(fish);
    if (svg) {
        const filePath = path.join(OUTPUT_DIR, `${fish.id}.svg`);
        fs.writeFileSync(filePath, svg, 'utf8');
        count++;
    } else {
        console.error(`Failed to generate SVG for: ${fish.id}`);
    }
});

console.log(`Done! Generated ${count}/${FISH_DATA.length} SVG files in ${OUTPUT_DIR}`);

// ============================================================
// Update fish-data.json to use .svg instead of .jpg
// ============================================================

const fishDataPath = path.join(__dirname, 'data', 'fish-data.json');
let fishDataContent = fs.readFileSync(fishDataPath, 'utf8');
fishDataContent = fishDataContent.replace(/images\/fish\/([a-z]+)\.jpg/g, 'images/fish/$1.svg');
fs.writeFileSync(fishDataPath, fishDataContent, 'utf8');
console.log('Updated fish-data.json image paths from .jpg to .svg');
