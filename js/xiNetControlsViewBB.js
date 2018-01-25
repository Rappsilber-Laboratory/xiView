//		Backbone view and controller for NGL 3D viewer
//
//		Martin Graham, Colin Combe, Rappsilber Laboratory, Alex Rose, PDB
//
//		js/xiNetLayouts.js

    var CLMSUI = CLMSUI || {};

	CLMSUI.xiNetControlsViewBB = CLMSUI.utils.BaseFrameView.extend ({

            events: function() {

                var parentEvents = CLMSUI.utils.BaseFrameView.prototype.events;
                if (_.isFunction (parentEvents)) {
                    parentEvents = parentEvents();
                }
                return _.extend ({}, parentEvents, {
                    "change .clickToSelect": "setClickModeSelect",
                    "change .clickToPan": "setClickModePan",
                    "click .downloadButton": "downloadSVG",
                    "click .autoLayoutButton": "autoLayout",
                  //  "click .loadLayoutButton": "loadLayout",
                    "click .saveLayoutButton": "saveLayout",
                });

            },

            setClickModeSelect: function (){
                CLMSUI.vent.trigger ("xiNetDragToSelect", true);
            },

            setClickModePan: function (){
                CLMSUI.vent.trigger ("xiNetDragToPan", true);
            },

            downloadSVG: function (){
                CLMSUI.vent.trigger ("xiNetSvgDownload", true);
            },

            autoLayout: function (){
                CLMSUI.vent.trigger ("xiNetAutoLayout", true);
            },

            loadLayout: function (){
                function load() {
                  //dialog.dialog( "close" );
                  // alert(name.val());

                  var xmlhttp = new XMLHttpRequest();
                  var url = "./php/loadLayout.php";
                  xmlhttp.open("POST", url, true);
                  //Send the proper header information along with the request
                  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                  xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
                      if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                          console.log("layout>" + xmlhttp.responseText, true);
                          //alert("Layout Saved");

                         var layouts = JSON.parse(xmlhttp.responseText);
                      }
                  };
                var sid = CLMSUI.compositeModelInst.get("clmsModel").get("sid");
                var params =  "sid=" + sid;
                xmlhttp.send(params);

                //CLMSUI.vent.trigger ("xiNetLoadLayout", layout);

              };

              load();

            },

            saveLayout: function (){
                var callback = function (layoutJson) {
                          var xmlhttp = new XMLHttpRequest();
                          var url = "./php/saveLayout.php";
                          xmlhttp.open("POST", url, true);
                          //Send the proper header information along with the request
                          xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                          xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
                              if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                                  console.log("Saved layout " + xmlhttp.responseText, true);
                                  alert("Layout Saved");
                              }
                          };
                        var sid = CLMSUI.compositeModelInst.get("clmsModel").get("sid");
                        var params =  "sid=" + sid
                                    + "&layout="+encodeURIComponent(layoutJson.replace(/[\t\r\n']+/g,""))
                                    + "&name="+encodeURIComponent(d3.select("#name").property("value"));
                        xmlhttp.send(params);
                };

                CLMSUI.vent.trigger ("xiNetSaveLayout", callback);
            },

            initialize: function (viewOptions) {

                // viewOptions.myOptions = _.extend (myDefaults, viewOptions.myOptions);
                CLMSUI.xiNetControlsViewBB.__super__.initialize.apply (this, arguments);

			          var self = this;

                // this.el is the dom element this should be getting added to, replaces targetDiv
                var mainDivSel = d3.select(this.el);

                var wrapperPanel = mainDivSel.append("div")
                    .attr ("class", "panelInner")
                ;

                wrapperPanel.html(
                    "<div class='sectionTable expectedFormatPanel'>" + //
                    "<table>" +
                        "<tbody>" +
                          "<tr>" +
                            "<td>Select protein</td>" +
                            "<td>LEFT click on protein; CTRL or SHIFT and LEFT click to add/remove proteins from selection.</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Toggle protein between bar and circle</td>" +
                            "<td>RIGHT click on protein</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Zoom</td>" +
                            "<td>Mouse wheel</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Move proteins</td>" +
                            "<td>Click and drag on protein</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Expand bar <br>(increases bar length until sequence is visible)</td>" +
                            "<td>SHIFT and RIGHT click on protein</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Rotate bar</td>" +
                            "<td>Click and drag on handles that appear at end of bar</td>" +
                          "</tr>" +
                          "<tr>" +
                            "<td>Flip self-links</td>" +
                            "<td>RIGHT-click on self-link</td>" +
                          "</tr>" +
                        "</tbody>" +
                      "</table>" +
                    "</div>" +
                    "<div class='xinetButtonBar'>" +
                          "<label class='panOrSelect'><span>DRAG TO PAN</span><input type='radio' name='clickMode' class='clickToPan' checked></label>" +
                          "<label class='panOrSelect'><span>DRAG TO SELECT</span><input type='radio' name='clickMode' class='clickToSelect'></label>" +
                          "<button class='btn btn-1 btn-1a autoLayoutButton'>Auto Layout</button>" +
                      "<p id='loadLayoutButton' class=class='btn btn-1 btn-1a'></p>" +
                          // "<button class='btn btn-1 btn-1a loadLayoutButton'>Load Layout</button>" +
                    // "</div>" +
                    // "<div class='xinetButtonBar'>" +
                          "<label for='name'> Layout Name: </label>" +
                          "<input type='text' name='name' id='name' value='New layout'>" +
                          "<button class='btn btn-1 btn-1a saveLayoutButton'>Save Layout</button>" +
                    // "</div>" +
                    // "<div class='xinetButtonBar'>" +
                        "<button class='btn btn-1 btn-1a downloadButton'>"+CLMSUI.utils.commonLabels.downloadImg+"SVG</button>" +
                    "</div>"
                  );

                //hack to take out pan/select option in firefox
                if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
                    // Do Firefox-related activities
                    d3.selectAll(".panOrSelect").style("display", "none");
                };



            },


            render: function () {
                CLMSUI.xiNetControlsViewBB.__super__.render();

                var xmlhttp = new XMLHttpRequest();
                var url = "./php/loadLayout.php";
                xmlhttp.open("POST", url, true);
                //Send the proper header information along with the request
                xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
                    if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        //console.log("layout>" + xmlhttp.responseText, true);
                        //alert("Layout Saved");

                       var layouts = JSON.parse(xmlhttp.responseText);
                       var menu = [];
                       for (var key in layouts){
                          menu.push({name:key});
                       }
                       //layouts.forEach(function (value, key, map) {});
                       // [
                       //     {name: "Invert", func: compModel.invertSelectedProteins, context: compModel},
                       //     {name: "Hide", func: compModel.hideSelectedProteins, context: compModel},
                       //     {name: "+Neighbours", func: compModel.stepOutSelectedProteins, context: compModel},
                       // ]
                       // Generate protein selection drop down
                       var compModel = CLMSUI.compositeModelInst;
                       new CLMSUI.DropDownMenuViewBB ({
                           el: "#loadLayoutButton",
                           model: CLMSUI.compositeModelInst.get("clmsModel"),
                           myOptions: {
                               title: "Load-Layout",
                               menu: menu
                           }
                       });
                    }
                };
                var sid = CLMSUI.compositeModelInst.get("clmsModel").get("sid");
                var params =  "sid=" + sid;
                xmlhttp.send(params);
                return this;

            },

            identifier: "xiNet Controls",
          });
