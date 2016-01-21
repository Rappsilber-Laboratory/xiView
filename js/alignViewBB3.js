(function(global) {
    "use strict";

    global.CLMSUI = global.CLMSUI || {};
    
    global.CLMSUI.AlignCollectionViewBB = global.CLMSUI.utils.BaseFrameView.extend ({
        events: function() {
          var parentEvents = global.CLMSUI.utils.BaseFrameView.prototype.events;
          if (_.isFunction(parentEvents)){
              parentEvents = parentEvents();
          }
          return _.extend({
              "change input.alignRadio" : "swapFocusModel",
          }, parentEvents, {});
        },
        
        initialize: function (viewOptions) {
            global.CLMSUI.AlignCollectionViewBB.__super__.initialize.apply (this, arguments);
            
            var topElem = d3.select(this.el);
            var modelViewID = topElem.attr("id") + "IndView";
            var topDiv = topElem.append("DIV").attr("class", "alignView");
            var template = _.template ("<P><%= headerText %></P><DIV class='checkHolder'></DIV><DIV id='<%= alignModelViewID %>'></DIV><DIV class='<%= alignControlClass %>' id='<%= alignControlID %>'></DIV><DIV class='<%= alignControlClass %>' id='<%= alignControlID2 %>'></DIV>");
            topDiv.html (template ({
                headerText: "Available Proteins for Alignment",
                alignModelViewID: modelViewID,
                alignControlClass:"alignSettings", 
                alignControlID: modelViewID+"Controls",
                alignControlID2: modelViewID+"Controls2",
            })); 
            
            var defaultModel = this.collection.models[0];
            
            this.modelView = new global.CLMSUI.AlignViewBB3 ({
                el: "#"+modelViewID, 
                model: defaultModel,
            })
            
            this.alignViewSettings = new global.CLMSUI.AlignSettingsViewBB ({
                el:"#"+modelViewID+"Controls",
                model: defaultModel,
            });
            
            this.alignViewBlosumSelector = new global.CLMSUI.CollectionAsSelectViewBB ({
                el:"#"+modelViewID+"Controls2",
                collection: CLMSUI.blosumCollInst,
                label: "Score Matrix",
                name: "BlosumSelector",
            });
            
        },
        
        render: function () {
            console.log ("AlignCollView", this);
            var topElem = d3.select(this.el);
            var list = topElem.select("DIV.checkHolder");
            var proteins = list.selectAll("span").data(this.collection.models, function(d) { return d.id; });
            
            proteins.exit().remove();
            
            var pspans = proteins.enter().append("span");
            
            pspans.append("input")
                .attr ("class", "alignRadio")
                .attr ("type", "radio")
                .attr ("name", topElem.attr("id")+"pgroup")
                .attr ("value", function(d) { return d.id; })
                .property ("checked", function (d,i) { return i === 0; })
            ;
            
            pspans.append("label")
                 .text (function(d) { return d.id; })
            ;
        },
        
        radioClicked: function (evt) {
            var model = this.collection.get(evt.target.value);
            this.swapFocusModel (model);
        },
        
        swapFocusModel: function (model) {
            var prevModel = this.modelView.model;
            if (prevModel) {
                this.alignViewBlosumSelector.stopListening (prevModel);
            }
        
            // TODO, safely swap these models in/ouit, maybe by generating new views altogether
            // http://stackoverflow.com/questions/9271507/how-to-render-and-append-sub-views-in-backbone-js
            // http://stackoverflow.com/questions/8591992/backbone-change-model-of-view
            // http://stackoverflow.com/questions/21411059/backbone-reusable-view-set-new-model-to-existing-view?lq=1
            this.modelView.model = model;
            this.alignViewSettings = model;
            
            
            this.alignViewBlosumSelector.setSelected (model.get("scoreMatrix"));
            // and then make it track it thereafter
            this.alignViewBlosumSelector.listenTo (model, "change:scoreMatrix", function(alignModel, scoreMatrix) {
                this.alignViewBlosumSelector.setSelected (scoreMatrix);
            });
        },
    });
    
    global.CLMSUI.AlignViewBB3 = global.Backbone.View.extend ({
        events: {
            "mouseleave td.seq>span" : "clearTooltip",
            "change input.diff" : "render",
        },

        initialize: function (viewOptions) {      
            this.tooltipModel = viewOptions.tooltipModel;
            
            var topElem = d3.select(this.el);
            var topDiv = topElem.append("DIV").attr("class", "alignView");
            var template = _.template ("<DIV class='tableWrapper'><TABLE><THEAD><TR><TH><%= firstColHeader %></TH><TH><%= secondColHeader %></TH></TR></THEAD><TBODY></TBODY></TABLE></DIV><div><label><%= diffLabel %></label><input type='checkbox' class='diff'></input></div>");
            topDiv.html (template ({
                    firstColHeader:"Name", 
                    secondColHeader:"Sequence", 
                    diffLabel:"Show differences only",
            }));       
            
            this.listenTo (this.model, "change:compAlignments", this.render);
            this.ellipStr = new Array(10).join("\"");
            //this.ellipStr = new Array(10).join("\u2026");
            
            return this;
        },
        
        ellipFill: function (length) {
            var sigfigs = length ? Math.floor (Math.log10 (length)) + 1 : 0;
            return this.ellipStr.substring (0, sigfigs);
        },
        
        render: function () {
            
            console.log ("rerendering alignment");
            var place = d3.select(this.el).select("tbody");
            var self = this;
            
            var showDiff = d3.select(this.el).select("input.diff").property("checked");
            
            var refs = this.model.get("refAlignments");
            var comps = this.model.get("compAlignments");
            var sids = [this.model.get("refID")].concat(this.model.get("compIDs"));
            
            console.log ("allSeqs", allSeqs);
            
            place.selectAll("tr").remove();
            

            
            comps.forEach (function (seq) {
                var rstr = seq.refStr;
                var str = seq.str;
                var l = [];
                var rf = [];
                var delStreak = false;
                var misStreak = false;
                var i = 0;
                for (var n = 0; n < str.length; n++) {
                    var c = str[n];
                    var r = rstr[n];
                    if ((c !== "-" && delStreak) || (c === r && misStreak)) {
                        rf.push (rstr.substring(i,n));
                        l.push (str.substring(i,n));
                        l.push ("</span>");
                        i = n;
                        delStreak = false;
                        misStreak = false;
                    }
              
                    if (c === "-" && !delStreak) {
                        delStreak = true;
                        if (misStreak || !showDiff) {
                            rf.push (rstr.substring(i,n));
                            l.push (str.substring(i,n));
                            if (misStreak) {
                                l.push ("</span>");
                                misStreak = false;
                            }
                        } else if (n > i) {
                            var estr = this.ellipFill (n - i);
                            l.push (estr);
                            rf.push (estr);
                        }
                        
                        l.push ("<span class='seqDelete'>");
                        i = n;
                    }
                    else if (c !== "-" && c !== r && !misStreak) {
                        misStreak = true;
                        if (delStreak || !showDiff) {
                            rf.push (rstr.substring(i,n));
                            l.push (str.substring(i,n));
                            if (delStreak) {
                                l.push ("</span>");
                                delStreak = false;
                            }
                        } else if (n > i) {
                            var estr = this.ellipFill (n - i);
                            l.push (estr);
                            rf.push (estr);
                        }
      
                        l.push ("<span class='seqMismatch'>");
                        i = n;
                    }
                }
                
                if (misStreak || delStreak || !showDiff) {
                    l.push (str.substring(i,n));
                    rf.push (rstr.substring(i,n));
                    if (misStreak || delStreak) {
                        l.push("</span>");
                        misStreak = false;
                        delStreak = false;
                    }
                } else if (n > i) {
                    var estr = this.ellipFill (n - i);
                    l.push (estr);
                    rf.push (estr);
                }
                
                seq.decoratedRStr = showDiff ? rf.join('') : rstr;
                seq.decoratedStr = l.join('');
            }, this);
            
            var allSeqs = [];
            //refs.forEach (function(r,i) { allSeqs.push(r); allSeqs.push(comps[i]); });
             refs.forEach (function(r,i) { allSeqs.push(comps[i]); allSeqs.push(comps[i]); });

            var containerID = d3.select(this.el).attr("id");
            
            var seqRows = place.selectAll("tr")
                .data(allSeqs)
                .enter()
                .append ("tr")
                //.attr ("id", function(d,i) { return containerID+sids[i]; })
                .attr ("id", function(d,i) { return "seqComp"+d.label+(i%2); })
            ;
            
            seqRows.append("th")
                .attr("class", "seqLabel")
                .html (function(d,i) { return ((i % 2) == 0) ? self.model.get("refID") : d.label; })
            ;
            
            seqRows.append("td")
                .attr("class", "seq")
                .append ("span")
                    //.html (function(d) { return d.decoratedStr || d.str; })
                    .html (function(d,i) { return ((i % 2) == 0) ? d.decoratedRStr : d.decoratedStr; })
                    // mousemove can't be done as a backbone-defined event because we need access to the d datum that d3 supplies
                    .on ("mousemove", function(d) {
                        self.invokeTooltip (d, this);
                    })
            ;
            
            return this;
        },
        
        clearTooltip: function (evt) {
            if (this.tooltipModel) {
                 this.tooltipModel.set ("contents", null);
            }
        },
        
        invokeTooltip: function (d, elem) {
            if (this.tooltipModel) {
                var xx = global.CLMSUI.utils.crossBrowserElementX (d3.event, elem);
                var width = $.zepto ? $(elem).width() : $(elem).outerWidth();
                var str = d.str;
                var charWidth = width / str.length;
                var charIndex = Math.floor (xx / charWidth);
                
                /*
                var evt = d3.event;
                var xs = {offsetX: evt.offsetX, clientX: evt.clientX, layerX: evt.layerX, pageX: evt.pageX, screenX: evt.screenX, x: evt.x};
                var offs = {offsetLeft: elem.offsetLeft, scrollLeft: elem.scrollLeft};
                console.log ("moved xs", xs, "offs", offs);
                console.log ("@", xx, width, charIndex, d3.event, d3.event.target, elem);
                //console.log (d.convertToRef, d.convertFromRef);
                */
                
                var t = d.refStr ? d.convertToRef[charIndex] : charIndex;

                this.tooltipModel.set("header", d.label).set("contents", [
                    ["Index", charIndex],
                    ["Value", str[charIndex]],
                    ["Ref Value", d.refStr ? d.refStr[charIndex] : str[charIndex]],
                ]).set("location", d3.event);
                this.tooltipModel.trigger ("change:location");
            }
        },
    });
})(this);