///<reference path='win.ts'/>
///<reference path='topic.ts'/>
///<reference path='navigator.ts'/>
var Data;
(function (Data) {
    "use strict";
    var groupsHash = {
        recent: { key: 'recent', title: 'Recent' },
        favorites: { key: 'favorites', title: 'Favorites' },
        today: { key: 'today', title: 'Today' },
        nearby: { key: 'xxnearby', title: 'Nearby' }
    };
    var list = new WinJS.Binding.List([]);
    function saveUserData() {
        Windows.Storage.ApplicationData.current.localSettings.values["userdata"] = JSON.stringify(userData);
    }
    var userdatastring = Windows.Storage.ApplicationData.current.localSettings.values["userdata"];
    var userData;
    //if (userdatastring != null) {
    //    userData = JSON.parse(userdatastring);
    //} else {
    userData = {
        favorites: ['Topology', 'Windows 8', 'Windows Phone 7'],
        recent: ['Einstein', 'Quantum Field Theory', 'Einstein Field Equations', 'Macleay\'s Swallowtail', 'Gödel metric'],
        today: ['Transformers', 'XBox', 'Mount Rainier', 'Independence Day (film)', 'Independence Day', 'Roland Emmerich', 'Padmanabhaswamy Temple']
    };
    saveUserData();
    //} 
    Object.keys(userData).forEach(function (groupName) {
        msSetImmediate(function () {
            populate(groupName, userData[groupName]);
        });
    });
    function populate(groupName, itemTitles) {
        for (var i = 0; i < itemTitles.length; i++) {
            list.push(createTopicFromTitle(itemTitles[i], groupsHash[groupName]));
        }
    }
    var locator = new Windows.Devices.Geolocation.Geolocator();
    locator.getGeopositionAsync().then(function (pos) {
        var lat = pos.coordinate.latitude;
        var long = pos.coordinate.longitude;
        var url = 'http://api.wikilocation.org/articles?radius=100000&limit=10&lat=' + lat + '&lng=' + long;
        return WinJS.xhr({ url: url });
    }).then(function (xhr) {
        var data = JSON.parse(xhr.responseText);
        addTopicsToGroup(data.articles, groupsHash['nearby']);
    }).done();
    function addTopicsToGroup(articles, group) {
        articles.forEach(function (article) {
            msSetImmediate(function () {
                list.push(createTopicFromTitle(article.title, group));
            });
        });
    }
    function addFavorite(title) {
        if (userData.favorites.indexOf(title) == -1) {
            userData.favorites.push(title);
            saveUserData();
            var topic = createTopicFromTitle(title, groupsHash['favorites']);
            list.push(topic);
            Encyclopedia.addToTile(title, topic.localImageSrc);
        }
    }
    Data.addFavorite = addFavorite;
    function removeFavorite(title) {
        var i = userData.favorites.indexOf(title);
        if (i != -1) {
            userData.favorites.splice(i, 1);
            saveUserData();
            var j = list.indexOf(createTopicFromTitle(title, groupsHash['favorites']));
            if (j != -1) {
                list.splice(j, 1);
            }
        }
    }
    Data.removeFavorite = removeFavorite;
    var groupedItems = list.createGrouped(groupKeySelector, groupDataSelector);
    function groupKeySelector(item) {
        return item.group.key;
    }
    function groupDataSelector(item) {
        return item.group;
    }
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) {
            return item.group.key === group.key;
        });
    }
    Data.getItemsFromGroup = getItemsFromGroup;
    Data.items = groupedItems;
    Data.groups = groupedItems.groups;
    function getItemReference(item) {
        return [item.group.key, item.title];
    }
    Data.getItemReference = getItemReference;
})(Data || (Data = {}));
//# sourceMappingURL=data.js.map