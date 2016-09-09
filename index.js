var PlayMusic = require('playmusic');
var fs = require('fs');

// make the output directory
fs.mkdir('output', function(err){});

var pm = new PlayMusic();
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log('Logging in...');
pm.init({email: config.username, password: config.password}, function(err) {
  if (err) console.error(err);
  console.log('Logged in, getting library...');
  getLibrary();
});

function getLibrary() {
  var allTracks = [];
  var deletedTracks = [];
  var trackCount = 0;
  var page = 1;
  
  function getTracks(nextPageToken) {
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
        console.log('Getting page '+page+'...');
        getTracks(library.nextPageToken);
      } else {
        console.log('Writing to files...');
        fs.writeFile("output/library.json", JSON.stringify(allTracks), function() {});
        fs.writeFile("output/library.meta", "Tracks: "+trackCount, function() {});
        console.log('You have '+allTracks.length+' total track(s) in your library');
        console.log('You have '+deletedTracks.length+' deleted track(s) in your library');
      }
    });
  }

  console.log('Getting page '+page+'...');
  getTracks('');
}

function getLists() {
  var lists = pm.getPlayLists(function(err, data) {
    fs.writeFile("output/lists.json", JSON.stringify(data.data), function() {});
  });
}
