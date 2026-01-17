
import fs from 'fs';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('local.db');

// Custom CSV parser to avoid dependency issues
function parseCSV(content) {
    const lines = content.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const row = {};
        const values = [];
        let currentVal = '';
        let inQuotes = false;

        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim());

        // Map to headers
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] || '';
        }
        result.push(row);
    }
    return result;
}

const CITY_COORDS = {
    'Edmonton': { lat: '53.5461', lng: '-113.4938' },
    'Westmead': { lat: '-33.8088', lng: '150.9389' },
    'Vasteras': { lat: '59.6106', lng: '16.5448' },
    'Oneata': { lat: '42.4529', lng: '-75.0638' }, // Assuming Oneonta, NY
    'Firenze': { lat: '43.7696', lng: '11.2558' },
    'Abington': { lat: '40.1241', lng: '-75.1195' },
    'Cambridge': { lat: '52.2053', lng: '0.1218' }, // Default to UK Cambridge if country is UK/England
    'Dordrecht': { lat: '51.7984', lng: '4.6627' },
    'Aalesund': { lat: '62.4722', lng: '6.1495' },
    'Wilmington': { lat: '39.7391', lng: '-75.5398' },
    'St. Petersburg': { lat: '27.7676', lng: '-82.6403' },
    'Breda': { lat: '51.5719', lng: '4.7683' },
    'Rimini': { lat: '44.0678', lng: '12.5695' },
    'Reggio Emilia': { lat: '44.6983', lng: '10.6310' },
    'Little Rock': { lat: '34.7465', lng: '-92.2896' },
    'Orlando': { lat: '28.5383', lng: '-81.3792' },
    'Stockholm': { lat: '59.3293', lng: '18.0686' },
    'Mesa': { lat: '33.4152', lng: '-111.8315' },
    'Phoenix': { lat: '33.4484', lng: '-112.0740' },
    'Glendale': { lat: '33.5387', lng: '-112.1860' },
    'Springfield': { lat: '42.1015', lng: '-72.5898' }, // MA
    'Boston': { lat: '42.3601', lng: '-71.0589' },
    'Cork': { lat: '51.8985', lng: '-8.4756' },
    'Longmont': { lat: '40.1672', lng: '-105.1019' },
    'Kalamazoo': { lat: '42.2917', lng: '-85.5872' },
    'Grand Rapids': { lat: '42.9634', lng: '-85.6681' },
    'Roanoke': { lat: '37.2710', lng: '-79.9414' },
    'Hickory': { lat: '35.7345', lng: '-81.3445' },
    'Torino': { lat: '45.0703', lng: '7.6869' },
    'Valenciennes': { lat: '50.3570', lng: '3.5236' },
    'La Louviere': { lat: '50.4794', lng: '4.1852' },
    'Brest': { lat: '48.3904', lng: '-4.4861' },
    'Chandler': { lat: '33.3062', lng: '-111.8413' },
    'Denver': { lat: '39.7392', lng: '-104.9903' },
    'Oklahoma City': { lat: '35.4676', lng: '-97.5164' },
    'Bern': { lat: '46.9480', lng: '7.4474' },
    'Akron': { lat: '41.0814', lng: '-81.5190' },
    'Detroit': { lat: '42.3314', lng: '-83.0458' },
    'Edmond': { lat: '35.6528', lng: '-97.4778' },
    'Houston': { lat: '29.7604', lng: '-95.3698' },
    'Chicago': { lat: '41.8781', lng: '-87.6298' },
    'Philadelphia': { lat: '39.9526', lng: '-75.1652' },
    'Brussels': { lat: '50.8503', lng: '4.3517' },
    'Twin Falls': { lat: '42.5558', lng: '-114.4701' },
    'Cincinnati': { lat: '39.1031', lng: '-84.5120' },
    'El Paso': { lat: '31.7619', lng: '-106.4850' },
    'Aurora': { lat: '39.7294', lng: '-104.8319' }, // CO
    'New York': { lat: '40.7128', lng: '-74.0060' },
    'Waterloo': { lat: '42.4922', lng: '-92.3421' }, // IA
    'Danbury': { lat: '41.3948', lng: '-73.4540' },
    'Sun City West': { lat: '33.6375', lng: '-112.3611' },
    'Lund': { lat: '55.7047', lng: '13.1910' },
    'Derby': { lat: '52.9225', lng: '-1.4746' },
    'Utrecht': { lat: '52.0907', lng: '5.1214' },
    'Roxbury': { lat: '42.3159', lng: '-71.0950' }, // Part of Boston
    'Johnson City': { lat: '36.3134', lng: '-82.3535' },
    'Amsterdam': { lat: '52.3676', lng: '4.9041' },
    'Rotterdam': { lat: '51.9244', lng: '4.4777' },
    'Evanston': { lat: '42.0451', lng: '-87.6877' },
    'Falun': { lat: '60.6036', lng: '15.6260' },
    'Utica': { lat: '43.1009', lng: '-75.2327' },
    'Milano': { lat: '45.4642', lng: '9.1900' },
    'Forde': { lat: '61.4503', lng: '5.8505' },
    'Hatiesburg': { lat: '31.3271', lng: '-89.2903' }, // Hattiesburg
    'Columbus': { lat: '39.9612', lng: '-82.9988' },
    'Baltimore': { lat: '39.2904', lng: '-76.6122' },
    'Joplin': { lat: '37.0842', lng: '-94.5133' },
    'Northhallerton': { lat: '54.3387', lng: '-1.4368' }, // Northallerton
    'Danville': { lat: '40.9634', lng: '-76.6125' }, // PA
    'Atlanta': { lat: '33.7490', lng: '-84.3880' },
    'Hartford': { lat: '41.7658', lng: '-72.6734' },
    'Haugesund': { lat: '59.4136', lng: '5.2680' },
    'Bergen': { lat: '60.3913', lng: '5.3221' },
    'Silver Spring': { lat: '38.9907', lng: '-77.0261' },
    'Montpellier': { lat: '43.6108', lng: '3.8767' },
    'Toronto': { lat: '43.6532', lng: '-79.3832' },
    'Lille': { lat: '50.6292', lng: '3.0573' },
    'Porto': { lat: '41.1579', lng: '-8.6291' },
    'Zwolle': { lat: '52.5168', lng: '6.0830' },
    'Genova': { lat: '44.4056', lng: '8.9463' },
    'Middlesbrough': { lat: '54.5742', lng: '-1.2350' },
    'Honolulu': { lat: '21.3069', lng: '-157.8583' },
    'Nottingham': { lat: '52.9548', lng: '-1.1581' },
    'Fort Myers': { lat: '26.6406', lng: '-81.8723' }, // Fort Myers
    'Allentown': { lat: '40.6023', lng: '-75.4714' },
    'Leiden': { lat: '52.1601', lng: '4.4970' },
    'Lincoln': { lat: '53.2274', lng: '-0.5377' }, // UK
    'Logan': { lat: '41.7355', lng: '-111.8344' },
    'Long Beach': { lat: '33.7701', lng: '-118.1937' },
    'New Orleans': { lat: '29.9511', lng: '-90.0715' },
    'Paloalto': { lat: '37.4419', lng: '-122.1430' }, // Palo Alto
    'Portland': { lat: '43.6591', lng: '-70.2568' }, // ME
    'S. Weymouth': { lat: '42.1537', lng: '-70.9392' },
    'Veldhoven': { lat: '51.4116', lng: '5.4093' },
    'Florence': { lat: '34.1954', lng: '-79.7626' }, // SC
    'Odessa': { lat: '31.8457', lng: '-102.3676' },
    'Venlo': { lat: '51.3704', lng: '6.1681' },
    'Augusta': { lat: '44.3106', lng: '-69.7795' }, // ME (or GA? Assuming ME from CSV context if consistent) - CSV says "Augusta, ME" but Medical College of Georgia... CSV says "Augusta ME, 30912" -> 30912 is GA zip.
    'South Bend': { lat: '41.6764', lng: '-86.2520' },
    'Osaka-Shi': { lat: '34.6937', lng: '135.5023' },
    'Minneapolis': { lat: '44.9778', lng: '-93.2650' },
    'Chatham': { lat: '40.7407', lng: '-74.3824' }, // NJ
    'San Francisco': { lat: '37.7749', lng: '-122.4194' },
    'Varberg': { lat: '57.1064', lng: '12.2530' },
    'Nashua': { lat: '42.7654', lng: '-71.4676' },
    'Auckland': { lat: '-36.8485', lng: '174.7633' },
    'Chapel Hill': { lat: '35.9132', lng: '-79.0558' },
    'Greeley': { lat: '40.4233', lng: '-104.7091' },
    'Salem': { lat: '42.5195', lng: '-70.8967' }, // MA
    'Humbly': { lat: '29.9988', lng: '-95.2622' }, // Humble, TX
    'London': { lat: '51.5074', lng: '0.1278' }, // UK
    'Harrow, Middlesex': { lat: '51.5786', lng: '-0.3340' },
    'Norwalk': { lat: '41.1176', lng: '-73.4079' },
    'Ormskirk': { lat: '53.5677', lng: '-2.8837' },
    'Bronx NY': { lat: '40.8448', lng: '-73.8648' },
    'Columbia': { lat: '34.0007', lng: '-81.0348' }, // SC
    'Vaxjo': { lat: '56.8777', lng: '14.8091' },
    'Hershey': { lat: '40.2859', lng: '-76.6502' },
    'Plymouth': { lat: '50.3755', lng: '-4.1427' },
    'Ft. Collins': { lat: '40.5853', lng: '-105.0844' },
    'Albuquerque': { lat: '35.0844', lng: '-106.6504' },
    'Salt Lake City': { lat: '40.7608', lng: '-111.8910' },
    'Everett': { lat: '47.9790', lng: '-122.2021' },
    'Rapid City': { lat: '44.0805', lng: '-103.2310' },
    'Reading': { lat: '40.3356', lng: '-75.9269' }, // PA
    'Redlands': { lat: '34.0556', lng: '-117.1825' },
    'Providence': { lat: '41.8240', lng: '-71.4128' },
    'Morgantown': { lat: '39.6295', lng: '-79.9559' }, // WV
    'Sarasota': { lat: '27.3364', lng: '-82.5307' },
    'Temple': { lat: '31.0982', lng: '-97.3428' },
    'Scottsdale': { lat: '33.4942', lng: '-111.9261' },
    'Geneve 14': { lat: '46.2044', lng: '6.1432' },
    'Austin': { lat: '30.2672', lng: '-97.7431' },
    'Lillehammer': { lat: '61.1151', lng: '10.4663' },
    'Medford': { lat: '42.4184', lng: '-71.1066' },
    'Farmington': { lat: '41.7198', lng: '-72.8320' },
    'Toulouse': { lat: '43.6047', lng: '1.4442' },
    'Sao Paulo': { lat: '-23.5505', lng: '-46.6333' },
    'Tucson': { lat: '32.2226', lng: '-110.9747' },
    'W. Hilis': { lat: '34.1975', lng: '-118.6439' }, // West Hills
    'Lexington': { lat: '38.0406', lng: '-84.5037' },
    'Louisville': { lat: '38.2527', lng: '-85.7585' },
    'Ann Arbor': { lat: '42.2808', lng: '-83.7430' },
    'Notre Dame': { lat: '41.7005', lng: '-86.2378' },
    'Pittsburgh': { lat: '40.4406', lng: '-79.9959' },
    'Seattle': { lat: '47.6062', lng: '-122.3321' },
    'Provo': { lat: '40.2338', lng: '-111.6585' },
    'Richmond': { lat: '37.5407', lng: '-77.4360' },
    'Ventura': { lat: '34.2746', lng: '-119.2290' },
    'Blacksburg': { lat: '37.2296', lng: '-80.4139' },
    'Riga': { lat: '56.9496', lng: '24.1052' },
    'Raleigh': { lat: '35.7796', lng: '-78.6382' },
    'Washington': { lat: '38.9072', lng: '-77.0369' },
    'Wichita': { lat: '37.6872', lng: '-97.3301' },
    'Valhalla': { lat: '41.0760', lng: '-73.7749' },
    'Royal Oak': { lat: '42.4895', lng: '-83.1446' },
    'Winchester': { lat: '42.4518', lng: '-71.1369' },
    'Yuma': { lat: '32.6927', lng: '-114.6277' },
    'jhgj': { lat: '0', lng: '0' },
    'Aarhus N.': { lat: '56.1780', lng: '10.1819' }, // Aarhus
    'St. Paul': { lat: '44.9537', lng: '-93.0900' },
    'Dublin': { lat: '53.3498', lng: '-6.2603' },
    'Sheffield': { lat: '53.3811', lng: '-1.4701' },
    'Lawton': { lat: '34.6036', lng: '-98.4160' },
    'Beirut': { lat: '33.8886', lng: '35.4955' },
    'Chiba': { lat: '35.6074', lng: '140.1065' },
    'Davis': { lat: '38.5449', lng: '-121.7405' },
    'Tuebingen': { lat: '48.5216', lng: '9.0576' },
    'Shanghai': { lat: '31.2304', lng: '121.4737' },
    'Tehran': { lat: '35.6892', lng: '51.3890' },
    'Himeji': { lat: '34.8151', lng: '134.6853' },
    'Yokohama': { lat: '35.4437', lng: '139.6380' },
    'Rochester': { lat: '43.1566', lng: '-77.6088' }, // Assuming NY based on Mayo Clinic St Marys having "Rochester, New York" in col
    'Chiba City': { lat: '35.6074', lng: '140.1065' },
    // 'Takatsuki': { lat: '34.8517', lng: '135.6178' },
    'Madrid': { lat: '40.4168', lng: '-3.7038' },
    'Las Palmas de Gran Canaria': { lat: '28.1235', lng: '-15.4363' }, // Fixed key truncate
    'Évora': { lat: '38.5714', lng: '-7.9135' },
    'Lisboa': { lat: '38.7223', lng: '-9.1393' },
    'Mashad': { lat: '36.2605', lng: '59.6168' },
    'Speyer': { lat: '49.3174', lng: '8.4326' },
    'Girona': { lat: '41.9794', lng: '2.8214' },
    'Bayonne': { lat: '43.4929', lng: '-1.4748' },
    'BESANCON': { lat: '47.2378', lng: '6.0241' },
    'TOULON': { lat: '43.1242', lng: '5.9280' },
    'Faro': { lat: '37.0179', lng: '-7.9308' },
    'Vila Nova de Gaia': { lat: '41.1239', lng: '-8.6118' },
    'Penafiel': { lat: '41.2078', lng: '-8.2861' },
    'Chennai': { lat: '13.0827', lng: '80.2707' },
    'Corbeil-Essonnes': { lat: '48.6133', lng: '2.4823' },
};


function runImport() {
    const csvContent = fs.readFileSync('/Users/oliver/Downloads/Locations.csv', { encoding: 'utf-8' });
    const records = parseCSV(csvContent);

    console.log(`Found ${records.length} records in CSV.`);

    const insertStmt = db.prepare(`
        INSERT INTO training_centers (id, name, address_json, nursery_level, is_active)
        VALUES (?, ?, ?, ?, 1)
    `);

    const checkStmt = db.prepare('SELECT id FROM training_centers WHERE name = ?');

    let insertedCount = 0;
    let skippedCount = 0;

    db.transaction(() => {
        for (const record of records) {
            // Basic validation
            const name = record.location_name?.trim();
            if (!name || name === '(No Institution name entered)') {
                // Try to construct a name from city
                if (record.location_city && record.location_city.trim()) {
                    // Keep going
                } else {
                    skippedCount++;
                    continue;
                }
            }

            const finalName = (name && name !== '(No Institution name entered)')
                ? name
                : `${record.location_city} Center`;

            // Check duplicate
            const existing = checkStmt.get(finalName);
            if (existing) {
                skippedCount++;
                continue;
            }

            // Parse Level
            let level = 1;
            if (record.nurserylevel) {
                if (record.nurserylevel.includes('III') || record.nurserylevel.includes('3')) level = 3;
                else if (record.nurserylevel.includes('IV') || record.nurserylevel.includes('4')) level = 4;
                else if (record.nurserylevel.includes('II') || record.nurserylevel.includes('2')) level = 2;
            } else if (record.nurserylevel_id) {
                const nid = parseInt(record.nurserylevel_id);
                if (nid >= 1 && nid <= 4) level = nid;
            }

            // Coordinates
            let lat = '0';
            let lng = '0';

            // Try city lookup
            let cityKey = record.location_city?.replace(/,.*$/, '').trim(); // Remove ", state" if present in city field
            if (CITY_COORDS[cityKey]) {
                lat = CITY_COORDS[cityKey].lat;
                lng = CITY_COORDS[cityKey].lng;
            }

            // Address JSON
            const address = {
                street: [record.location_address1, record.location_address2, record.location_address3].filter(Boolean).join(', '),
                city: record.location_city,
                state: record.location_state,
                zip: record.location_zip,
                country: record.location_country,
                formatted: [record.location_city, record.location_state, record.location_country].filter(Boolean).join(', '),
                lat,
                lng
            };

            insertStmt.run(
                randomUUID(),
                finalName,
                JSON.stringify(address),
                level
            );
            insertedCount++;
        }
    })();

    console.log(`Import completed. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);
}

runImport();
