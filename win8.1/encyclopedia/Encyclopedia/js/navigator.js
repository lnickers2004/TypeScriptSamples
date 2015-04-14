///<reference path='win.ts'/>
///<reference path='data.ts'/>
var Encyclopedia;
(function (Encyclopedia) {
    "use strict";
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var displayProps = Windows.Graphics.Display.DisplayProperties;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    Encyclopedia.navigator = null;
    var PageControlNavigator = (function () {
        // Define the constructor function for the PageControlNavigator.
        function PageControlNavigator(element, options) {
            this.element = null;
            this.home = "";
            this.lastViewstate = 0;
            this.element = (element || document.createElement("div"));
            this.element.appendChild(this._createPageElement());
            this.home = options.home;
            this.lastViewstate = appView.value;
            nav.onnavigated = this._navigated.bind(this);
            window.onresize = this._resized.bind(this);
            document.body.onkeyup = this._keyupHandler.bind(this);
            document.body.onkeypress = this._keypressHandler.bind(this);
            document.body.onmspointerup = this._mspointerupHandler.bind(this);
            Encyclopedia.navigator = this;
        }
        Object.defineProperty(PageControlNavigator.prototype, "pageControl", {
            get: function () {
                return this.pageElement && this.pageElement.winControl;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageControlNavigator.prototype, "pageElement", {
            get: function () {
                return this.element.firstElementChild;
            },
            enumerable: true,
            configurable: true
        });
        // This function creates a new container for each page.
        PageControlNavigator.prototype._createPageElement = function () {
            var element = document.createElement("div");
            element.style.width = "100%";
            element.style.height = "100%";
            return element;
        };
        // This function responds to keypresses to only navigate when
        // the backspace key is not used elsewhere.
        PageControlNavigator.prototype._keypressHandler = function (args) {
            if (args.key === "Backspace") {
                nav.back();
            }
        };
        PageControlNavigator.prototype._keyupHandler = function (args) {
            if ((args.key === "Left" && args.altKey) || (args.key === "BrowserBack")) {
                nav.back();
            }
            else if ((args.key === "Right" && args.altKey) || (args.key === "BrowserForward")) {
                nav.forward();
            }
        };
        PageControlNavigator.prototype._mspointerupHandler = function (args) {
            if (args.button === 3) {
                nav.back();
            }
            else if (args.button === 4) {
                nav.forward();
            }
        };
        PageControlNavigator.prototype._fwdbackHandler = function (e) {
            if (e.altKey) {
                switch (e.keyCode) {
                    case utils.Key.leftArrow:
                        nav.back();
                        break;
                    case utils.Key.rightArrow:
                        nav.forward();
                        break;
                }
            }
        };
        //private _viewstatechanged(e) {
        //    this._updateLayout()(this.pageElement, e.layout, displayProps.currentOrientation);
        //}
        // This function responds to navigation by adding new pages
        // to the DOM.
        PageControlNavigator.prototype._navigated = function (args) {
            var _this = this;
            var oldElement = this.pageElement;
            var newElement = this._createPageElement();
            var parentedComplete;
            var parented = new WinJS.Promise(function (c) {
                parentedComplete = c;
            });
            args.detail.setPromise(WinJS.Promise.timeout().then(function () {
                if (oldElement.winControl && oldElement.winControl.unload) {
                    oldElement.winControl.unload();
                }
                return WinJS.UI.Pages.render(args.detail.location, newElement, args.detail.state, parented);
            }).then(function (control) {
                _this.element.appendChild(newElement);
                _this.element.removeChild(oldElement);
                oldElement.innerText = "";
                _this.navigated();
                parentedComplete();
            }));
        };
        PageControlNavigator.prototype._resized = function (args) {
            if (this.pageControl && this.pageControl.updateLayout) {
                this.pageControl.updateLayout.call(this.pageControl, this.pageElement, appView.value, this.lastViewstate);
            }
            this.lastViewstate = appView.value;
        };
        //private _updateLayout() { return (this.pageControl() && this.pageControl().updateLayout) || function() { }; }
        // This function updates application controls once a navigation
        // has completed.
        PageControlNavigator.prototype.navigated = function () {
            // Do application specific on-navigated work here
            var backButton = this.pageElement.querySelector("header[role=banner] .win-backbutton");
            if (backButton != null) {
                backButton.onclick = function () {
                    nav.back();
                };
                if (nav.canGoBack) {
                    backButton.removeAttribute("disabled");
                }
                else {
                    backButton.setAttribute("disabled", "disabled");
                }
            }
        };
        return PageControlNavigator;
    })();
    Encyclopedia.PageControlNavigator = PageControlNavigator;
    WinJS.Utilities.markSupportedForProcessing(PageControlNavigator);
    function navigateHome() {
        var home = document.querySelector("#contenthost").winControl.home;
        var loc = nav.location;
        if (loc !== "" && loc !== home) {
            nav.navigate(home);
        }
    }
    Encyclopedia.navigateHome = navigateHome;
    WinJS.Utilities.markSupportedForProcessing(navigateHome);
    function refresh() {
        var control = document.querySelector("#contenthost").winControl;
        if (control && control.pageControl && control.pageControl.refreshCurrent) {
            control.pageControl.refreshCurrent(control.element);
        }
    }
    Encyclopedia.refresh = refresh;
    WinJS.Utilities.markSupportedForProcessing(refresh);
    function addFavorite() {
        var control = document.querySelector("#contenthost").winControl;
        if (control && control.pageControl && control.pageControl.refreshCurrent) {
            var elem = control.element.querySelector(".itemDetailPage header[role=banner] .pagetitle");
            var title = elem.textContent;
            Data.addFavorite(title);
        }
    }
    Encyclopedia.addFavorite = addFavorite;
    WinJS.Utilities.markSupportedForProcessing(addFavorite);
    function removeFavorite() {
        var control = document.querySelector("#contenthost").winControl;
        if (control && control.pageControl && control.pageControl.refreshCurrent) {
            var title = control.element.querySelector(".itemDetailPage header[role=banner] .pagetitle").textContent;
            Data.removeFavorite(title);
        }
    }
    Encyclopedia.removeFavorite = removeFavorite;
    WinJS.Utilities.markSupportedForProcessing(removeFavorite);
    function addToTile(text, imgSrc) {
        var tileUpdater = Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication();
        var template = Windows.UI.Notifications.TileTemplateType.tileWideImageAndText01;
        var tileXml = Windows.UI.Notifications.TileUpdateManager.getTemplateContent(template);
        var tileTextAttributes = tileXml.getElementsByTagName("text");
        tileTextAttributes.forEach(function (value, index) {
            value.appendChild(tileXml.createTextNode("textField " + (index + 1)));
        });
        var tileImageAttributes = tileXml.getElementsByTagName("image");
        var imgUri = new Windows.Foundation.Uri(Windows.Storage.ApplicationData.current.localFolder.path + "/").combineUri(imgSrc);
        var elem = tileImageAttributes.getAt(0);
        elem.setAttribute("src", imgUri.absoluteUri);
        elem.setAttribute("alt", "graphic");
        elem.setAttribute("id", "1");
        var tileNotification = new Windows.UI.Notifications.TileNotification(tileXml);
        tileUpdater.enableNotificationQueue(true);
        tileUpdater.update(tileNotification);
    }
    Encyclopedia.addToTile = addToTile;
})(Encyclopedia || (Encyclopedia = {}));
//# sourceMappingURL=navigator.js.map