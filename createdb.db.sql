BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Names" (
	"name"	TEXT,
	"position"	INTEGER
);
CREATE TABLE IF NOT EXISTS "Type" (
	"type"	TEXT
);
CREATE TABLE IF NOT EXISTS "Jobs" (
	"timestamp"	INTEGER,
	"requestor"	TEXT,
	"command"	TEXT,
	"prompt"	TEXT,
	"modifier"	TEXT,
	"nsfw"	INTEGER,
	"name"	TEXT,
	"type"	TEXT
	"status"	INTEGER,
	"generationId"	TEXT
);
CREATE TABLE IF NOT EXISTS "commands" (
	"timestamp"	INTEGER,
	"command"	TEXT UNIQUE,
	"modifier"	TEXT,
	"negativePrompts"	TEXT,
	"model"	TEXT,
	"setBy"	TEXT,
	"botResponse"	TEXT DEFAULT Null
);
INSERT INTO "Names" ("name","position") VALUES ('Snizzlefizzed',1),
 ('Glibberwocked',1),
 ('Quagglifed',1),
 ('Blifflejinked',1),
 ('Zonkledoodled',1),
 ('Squiggledunked',1),
 ('Flibbertwisted',1),
 ('Skedaddledinked',1),
 ('Gobbledunked',1),
 ('Zigzagglazed',1),
 ('Snozzlebooped',1),
 ('Blunderbussed',1),
 ('Quibblywunked',1),
 ('Flibbertigibbeted',1),
 ('Squigglepopped',1),
 ('Gibberishified',1),
 ('Zigzagglittered',1),
 ('Snickerfuddled',1),
 ('Blitzedoodle',1),
 ('Quirkyjived',1),
 ('Fizzlefied',1),
 ('Skedaddledazzled',1),
 ('Gibberwocked',1),
 ('Zigzagglorified',1),
 ('Snozzleflipped',1),
 ('Blunderbaffled',1),
 ('Quirkyfizzed',1),
 ('Flabbergibbeted',1),
 ('Squigglefunked',1),
 ('Gobblediddled',1),
 ('Zonklejived',1),
 ('Snazzlefizzed',1),
 ('Blitzedibbled',1),
 ('Quibblygibbeted',1),
 ('Flitterfizzed',1),
 ('Squidgledoodled',1),
 ('Gibberflustered',1),
 ('Zigzagglepopped',1),
 ('Snicklefunked',1),
 ('Blunderbumbled',1),
 ('Quirkywhizzed',1),
 ('Flabbergiggled',1),
 ('Squigglejived',1),
 ('Gobbledoodled',1),
 ('Zonklefunked',1),
 ('Snazzlewunked',1),
 ('Blitzedoodlefied',1),
 ('Quirkyfuddled',1),
 ('Flitterfizzled',1),
 ('Squidglefunked',1),
 ('Gibberflibbertied',1),
 ('Zigzagglepuffed',1),
 ('Snicklefizzed',1),
 ('Blunderbaffed',1),
 ('Quirkyjinked',1),
 ('Flabbergoggled',1),
 ('Squigglepiffled',1),
 ('Gobbledibbled',1),
 ('Zonklejazzed',1),
 ('Snazzlejinked',1),
 ('Blitzedoodled',1),
 ('Quibblyfizzed',1),
 ('Flitterfuddled',1),
 ('Squidglefiddled',1),
 ('Gibberflabbergasted',1),
 ('Zigzagglepuzzled',1),
 ('Snickleflustered',1),
 ('Blunderbooped',1),
 ('Quirkybluffed',1),
 ('Flabbergiggledooked',1),
 ('Squigglepoppedibbled',1),
 ('Gobbledoodlefied',1),
 ('Zonklewhizzed',1),
 ('Snazzlebooped',1),
 ('Blitzedazzeled',1),
 ('Quibblygobbled',1),
 ('Flitterdiddled',1),
 ('Squidglewunked',1),
 ('Jasting',1),
 ('Franning',1),
 ('Crizzing',1),
 ('Vobling',1),
 ('Flenting',1),
 ('Drunging',1),
 ('Quiffing',1),
 ('Pliving',1),
 ('Skarling',1),
 ('Thrunding',1),
 ('Slorping',1),
 ('Chimming',1),
 ('Zinting',1),
 ('Bladding',1),
 ('Plopping',1),
 ('Spriving',1),
 ('Quirling',1),
 ('Trangling',1),
 ('Snoffing',1),
 ('Stamping',1),
 ('Grizzing',1),
 ('Chonking',1),
 ('Whiffling',1),
 ('Gorbling',1),
 ('Slarking',1),
 ('Cranting',1),
 ('Quirking',1),
 ('Dimping',1),
 ('Glistening',1),
 ('Snoffling',1),
 ('Plinking',1),
 ('Crondling',1),
 ('Frinking',1),
 ('Snizzing',1),
 ('Sprinkling',1),
 ('Bliffling',1),
 ('Vorfing',1),
 ('Squilding',1),
 ('Zarking',1),
 ('Dinkling',1),
 ('Glarping',1),
 ('Quirbling',1),
 ('Trantling',1),
 ('Snarming',1),
 ('Glimping',1),
 ('Strumping',1),
 ('Slipping',1),
 ('Flumping',1),
 ('Driveling',1),
 ('Jivont',2),
 ('Frickle',2),
 ('Plangus',2),
 ('Blimph',2),
 ('Quiffle',2),
 ('Splinx',2),
 ('Crindle',2),
 ('Zorble',2),
 ('Skramp',2),
 ('Flimber',2),
 ('Quandry',2),
 ('Glompus',2),
 ('Snackle',2),
 ('Trimbly',2),
 ('Skrundle',2),
 ('Ploosh',2),
 ('Quibble',2),
 ('Grivvle',2),
 ('Floompa',2),
 ('Blinx',2),
 ('Scrundle',2),
 ('Snazzle',2),
 ('Driffle',2),
 ('Plundex',2),
 ('Quambo',2),
 ('Splindish',2),
 ('Zimble',2),
 ('Crumpus',2),
 ('Frabble',2),
 ('Plumpit',2),
 ('Skrizzle',2),
 ('Blonk',2),
 ('Quiggle',2),
 ('Snoggle',2),
 ('Frundle',2),
 ('Zibber',2),
 ('Crackle',2),
 ('Ploople',2),
 ('Splorble',2),
 ('Quaddle',2),
 ('Grimble',2),
 ('Blifft',2),
 ('Skrimble',2),
 ('Flonk',2),
 ('Quivver',2),
 ('Snizzle',2),
 ('Glarple',2),
 ('Plonkus',2),
 ('Splinxle',2),
 ('Skroop',2),
 ('Quobbit',2),
 ('Frazzle',2),
 ('Zibbly',2),
 ('Crumble',2),
 ('Drazzle',2),
 ('Flonkus',2),
 ('Splunk',2),
 ('Quigget',2),
 ('Skrump',2),
 ('Bliffle',2),
 ('Quonk',2),
 ('Snoodle',2),
 ('Glumpus',2),
 ('Plizzle',2),
 ('Skronk',2),
 ('Zibble',2),
 ('Crundle',2),
 ('Splunkle',2),
 ('Quibbit',2),
 ('Plunder',2),
 ('Skriddle',2),
 ('Blonkus',2),
 ('Glurble',2),
 ('Quiddit',2),
 ('Sponk',2),
 ('Zobble',2),
 ('Crumple',2),
 ('Splibble',2),
 ('Skruffle',2),
 ('Plort',2),
 ('Flumble',2),
 ('Skripple',2),
 ('Frungle',2),
 ('Skrumpus',2);
INSERT INTO "Type" ("type") VALUES ('Aqua'),
 ('Beast'),
 ('Beast-Warrior'),
 ('Creator God'),
 ('Cyberse'),
 ('Dinosaur'),
 ('Divine-Beast'),
 ('Dragon'),
 ('Fairy'),
 ('Fiend'),
 ('Fish'),
 ('Illusion'),
 ('Insect'),
 ('Machine'),
 ('Plant'),
 ('Psychic'),
 ('Pyro'),
 ('Reptile'),
 ('Rock'),
 ('Sea Serpent'),
 ('Spellcaster'),
 ('Thunder'),
 ('Warrior'),
 ('Winged Beast'),
 ('Wyrm'),
 ('Zombie'),
 ('Aqua'),
 ('Beast'),
 ('Beast-Warrior'),
 ('Creator God'),
 ('Cyberse'),
 ('Dinosaur'),
 ('Divine-Beast'),
 ('Dragon'),
 ('Fairy'),
 ('Fiend'),
 ('Fish'),
 ('Illusion'),
 ('Insect'),
 ('Machine'),
 ('Plant'),
 ('Psychic'),
 ('Pyro'),
 ('Reptile'),
 ('Rock'),
 ('Sea Serpent'),
 ('Spellcaster'),
 ('Thunder'),
 ('Warrior'),
 ('Winged Beast'),
 ('Wyrm'),
 ('Zombie');
COMMIT;
