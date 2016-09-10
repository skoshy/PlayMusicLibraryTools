// required
var pm = new(require('playmusic'));
var fs = require('fs');
var dateFormat = require('dateformat');
var ini = require('ini');

var fileTimestamp = dateFormat(new Date(), "yyyy-mm-dd-hh-MM-ss");

var config = ini.parse(fs.readFileSync('config.ini', 'utf8'));

// create the output directory if it doesn't already exist
fs.mkdir(config.outputfolder, function(err){});

log('Logging in...');

// Login
pm.init({email: config.username, password: config.password}, function(err) {
	if (err) console.error(err);
	log('Logged in, getting library...');
	
	// let's get the library
	getLibrary();
});

function getLibrary() {
	var allTracks = [];
	var deletedTracks = [];
	var trackCount = 0;
	var page = 1;

	function getTracks(nextPageToken) {
		log('Getting page '+page+'...');
		pm.getAllTracks({"nextPageToken": nextPageToken}, function(err, library) {
			// let's loop through and delete unnecesary data
			library.data.items.forEach(function(item) {
				delete item.kind;
				delete item.clientId;
				delete item.creationTimestamp;
				delete item.lastModifiedTimestamp;
				delete item.recentTimestamp;
				delete item.durationMillis;
				delete item.beatsPerMinute;
				delete item.albumArtRef;
				delete item.artistArtRef;
				delete item.totalTrackCount;
				delete item.discNumber;
				delete item.totalDiscCount;
				delete item.year;
				delete item.rating;
				delete item.estimatedSize;
				delete item.trackType;
				delete item.artistId;
				delete item.albumId;
				delete item.nid;

				// check if the track has been deleted
				if (item.deleted) {
					deletedTracks.push(item);
				}
			});

			trackCount += library.data.items.length;      
			allTracks = allTracks.concat(library.data.items);

			if (library.nextPageToken) {
				page++;
				getTracks(library.nextPageToken);
			} else {
				// write the library and deleted tracks to files
				log('Writing to files...');
				writeToFile("library."+fileTimestamp+".json", allTracks);
				writeToFile("library."+fileTimestamp+".meta", {trackCount: trackCount});
				writeToFile("deletedTracks."+fileTimestamp+".json", deletedTracks);
				writeToFile("deletedTracks."+fileTimestamp+".meta", {trackCount: deletedTracks.length});
				
				// display to the user the info we collected
				log('You have '+allTracks.length+' total track(s) in your library');
				log('You have '+deletedTracks.length+' deleted track(s) in your library');
			}
		});
	}
	
	getTracks('');
}

function getLists() {
	var lists = pm.getPlayLists(function(err, data) {
		fs.writeFile("output/lists.json", JSON.stringify(data.data), function() {});
	});
}

function writeToFile(filename, data) {
	fs.writeFile(config.outputfolder+"/"+filename, JSON.stringify(data, null, 2)+"\n", function() {});
}

function log(data) { console.log(data); }