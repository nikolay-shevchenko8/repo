///////// TODO ZOOM! /////////

// function zoomGlobe() {
//     return ... ;
// }
var casesLiter = {nom: 'литр', gen: 'литра', plu: 'литров'},
    litersValue,
    litersCorrect;

var bubbleText, bubbleTextIntro,
    clickHelp = true,
    p1, p2, p3, p4, p5, p6, p7,
    bubble;

function init() {

    var containerD3 = document.getElementById("globeDiv"),
        width = 448,
        height = 600,
        sens = 0.35,
        focused;
        
    //Setting projection

    var projection = d3.geo.orthographic()
        .scale(235) //.scale(function() {return zoomGlobe();}) //245
        .rotate([0, 0])
        .translate([236, 236])
        .clipAngle(90);

    var path = d3.geo.path()
        .projection(projection);

    //SVG container

    var svg = d3.select("#globeDiv").append("svg").attr("height", height);
        svg.append("path") //add water
        .datum({ type: "Sphere" })
        .attr("class", "water")
        .attr("d", path);

        bubble = d3.select("#bubble");

    var countryTooltip = d3.select("body").append("div").attr("id", "tooltip"),
        intro = d3.selectAll(".intro"),
        
        one = d3.select("#one"),
        threeText = d3.select("#three"),
        four = d3.select("#four"),
        two = d3.select("#two"), //тут блок 2
        countryList = d3.select("body")
            .append("select")
            .attr("id", "countrySelect")
            .attr("name", "countries");

    var ocean_fill = svg.append("defs").append("radialGradient")
        .attr("id", "ocean_fill")
        .attr("cx", "75%")
        .attr("cy", "25%");

        ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#b7cce0");
        ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#4881bb");

    //var color_domain = [0.1, 100, 250, 450, 750, 1250, 2000];
    var color_domain = [0.01, 10, 50, 75, 100, 150, 200]; // м3 / чел / год (в быту!)

    //var ext_color_domain = [0, 0.1, 100, 250, 450, 750, 1250, 2000]; // м3 / чел / год (общий расход страны!)
    var ext_color_domain = [0, 0.1, 10, 50, 75, 100, 150, 200];

    //var legend_labels = ["н/д", "< 100", "< 250", "< 450", "< 750", "< 1250", "< 2000", "> 2000"];
    var legend_labels = ["н/д", "< 10", "< 50", "< 75", "< 100", "< 150", "< 200", "> 200"]; 

    var color = d3.scale.threshold().domain(color_domain).range(["#9f9f9f", "#d4301f", "#d47d1f", "#bdd41f", "#4ed41f", "#3fa81a", "#348d16", "#245f10"]);

    appendIntro();

    queue()
        .defer(d3.json, "data/world-110m.json")
        .defer(d3.csv, "data/water_consumption.csv")
        .await(ready);

    //Main function

    function ready(error, world, waterData) {

        var countryById = {},
            countryTextById = {},
            domesticById = {},
            countries = topojson.feature(world, world.objects.countries).features;

            //countryList.append("option").text("").property("value", 9999).property("selected", "selected");

        waterData.forEach(function (d) {

            ///////////////// ЗАПОЛНЯЕМ 'select' //////////////////
            option = countryList.append("option");
            option.text(d.country);
            option.property("value", d.id);
            ///////////////// //////////////// //////////////////

            countryById[d.id] = d.country;
            countryTextById[d.id] = d.country_h2;
            domesticById[d.id] = +d.domestic;
        });

        ///////////////////////////////////////////////

        //Drawing countries on the globe

        var world = svg.selectAll("path.land")
        .data(countries)
        .enter().append("path")
        .attr("class", "land")
        .attr("d", path)
        .style("fill", function (d) { return color(domesticById[d.id]); }) //consumeById

        ///////////// CLICK /////////////

        .on("click", function (d) {

            $('#countrySelect option').prop('selected', function() { return this.defaultSelected; }); /////////////////////////////////////////////////////

            removeIntro();
            bubble.transition().duration(500).style("height", "192px"); 

            litersValue = (domesticById[d.id]/0.365).toFixed();
            litersCorrect = units(litersValue, casesLiter);

            if (litersValue == 0) {
                one.text("К сожалению, данных о потреблении воды жителями " + countryTextById[d.id] + " нет.").style("font-weight", "normal");
                two.text("");
                threeText.text("Выбери другую страну.").style("fill", "#686868");
                four.text("");
                
            } else {
                one.text("Каждый житель").style("font-weight", "bold");
                two.text(countryTextById[d.id]);
                threeText.text("в среднем расходует в быту").style("font-weight", "bold");
                four.text(litersValue + " " + litersCorrect + " воды в день!")
                    .style("color", color(domesticById[d.id]));
            }
            
            var consumePerDay = domesticById[d.id] / 365;
            cubeScale = Math.pow(consumePerDay, 1/3);

            var rotate = projection.rotate(),
            focusedCountry = d,
            p = d3.geo.centroid(focusedCountry);

            svg.selectAll(".focused").classed("focused", focused = false);

            //Globe rotating

            (function transition() {
                d3.transition()
                .duration(1000)
                .tween("rotate", function () {
                    var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
                    return function (t) {
                        projection.rotate(r(t));
                        svg.selectAll("path").attr("d", path)
                        .classed("focused", function (d, i) { return d.id == focusedCountry.id ? focused = d : false; });
                    };
                })
            })();
        })

        //Drag event

        .call(d3.behavior.drag()
        .origin(function () { var r = projection.rotate(); return { x: r[0] / sens, y: -r[1] / sens }; })
        .on("drag", function () {
            var rotate = projection.rotate();
            projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
            svg.selectAll("path.land").attr("d", path);
            svg.selectAll(".focused").classed("focused", focused = false);
        }))

        //Mouse events

        .on("mouseover", function (d) {
           countryTooltip.text(countryById[d.id])
            .style("left", (d3.event.pageX + 7) + "px")
            .style("top", (d3.event.pageY - 15) + "px")
            .style("display", "block")
            .style("opacity", 1);
        })

        .on("mouseout", function (d) {
            countryTooltip.style("opacity", 0)
            .style("display", "none");
        })

        .on("mousemove", function (d) {
            countryTooltip.style("left", (d3.event.pageX + 7) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
        });

        //Country focus on option select

        d3.select("select").on("change", function () {

        //if (this.value != 9999) {

            removeIntro();
            bubble.transition().duration(500).style("height", "192px"); 

            litersValue = (domesticById[this.value]/0.365).toFixed();
            litersCorrect = units(litersValue, casesLiter);

            if (litersValue == 0) {
                one.text("К сожалению, данных о потреблении воды жителями " + countryTextById[this.value] + " нет.").style("font-weight", "normal");
                two.text("");
                threeText.text("Выбери другую страну.").style("font-weight", "normal");
                four.text("");
            } else {
                one.text("Каждый житель").style("font-weight", "bold");
                two.text(countryTextById[this.value]);
                threeText.text("в среднем расходует в быту").style("font-weight", "bold");
                four.text(litersValue + " " + litersCorrect + " воды в день!")
                    .style("color", color(domesticById[this.value]));
            }

            var consumePerDay = domesticById[this.value] / 365;
            cubeScale = Math.pow(consumePerDay, 1/3);
            
            var rotate = projection.rotate(),
            focusedCountry = country(countries, this), //передаем ф-ии 'country' массив 'countries' и текущее состояние элемента, которое в 'this.value' хранит ID страны!
            p = d3.geo.centroid(focusedCountry);

            svg.selectAll(".focused").classed("focused", focused = false);

            //Globe rotating

            (function transition() {
                d3.transition()
                .duration(1000)
                .tween("rotate", function () {
                    var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
                    return function (t) {
                        projection.rotate(r(t));
                        svg.selectAll("path").attr("d", path)
                        .classed("focused", function (d, i) { return d.id == focusedCountry.id ? focused = d : false; });
                    };
                })
            })();
        //}
        });

        function country(countries, selected) {
            // console.log("countries.length = " + countries.length);
            // console.log("selected.value = " + selected.value);

            for (var i = 0, l = countries.length; i < l; i++) {
                if (countries[i].id == selected.value) { return countries[i]; }
            }
        };

    };

    //Adding legend for our Choropleth

    var legend = svg.selectAll("g.legend")
    .data(ext_color_domain)
    .enter().append("g")
    .attr("class", "legend");

    var ls_w = 50, ls_h = 20;

    legend.append("rect")
    .attr("x", function (d, i) { return width - (i * ls_w) - 2 * ls_w + 40; }) //data и [i] (0...7)
    //.attr("y", 495)
    .attr("y", 520)
    .attr("width", ls_w)
    .attr("height", ls_h)
    .style("fill", function (d, i) { return color(d); })
    .style("opacity", 1);

    legend.append("text")
    .attr("x", function (d, i) { return width - (i * ls_w) - ls_w; }) //console.log(width, height);
    .attr("y", 560) 
    .attr("font-weight", "bold")
    .attr("font-size", "16px")
    .style("fill", function (d, i) { return color(d); })
    .text(function (d, i) { return legend_labels[i]; });

    svg.append("text")
    .attr("x", 56)
    .attr("y", 510)
    .attr("font-weight", "bold")
    .attr("font-size", "18px")
    // .style("fill", "#808080")
    .text("Потребление воды в быту (тыс. л./чел./год):")
    initThreeJs(); 
}

function units(num, cases) {
    num = Math.abs(num);
    
    var word = '';
    
    if (num.toString().indexOf('.') > -1) {
        word = cases.gen;
    } else { 
        word = (
            num % 10 == 1 && num % 100 != 11 
                ? cases.nom
                : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) 
                    ? cases.gen
                    : cases.plu
        );
    }
    
    return word;
}

function appendIntro() {

    clickHelp = true;
    cubeScale = 0;



    bubble.style("right", "45%").style("width", "37%").transition().duration(500).style("height", "350px");

    bubbleTextOne = document.getElementById('one');
    bubbleTextOne.innerHTML = '';

    bubbleTextTwo = document.getElementById('two');
    bubbleTextTwo.innerHTML = '';

    bubbleTextThree = document.getElementById('three');
    bubbleTextThree.innerHTML = '';

    bubbleTextFour = document.getElementById('four');
    bubbleTextFour.innerHTML = '';

    bubbleTextIntro = document.getElementById('bubbleTextIntro');
    
    if (bubbleTextIntro.childNodes.length === 0) {
        p1 = document.createElement('p');
        p1.className = 'intro';
        p1.id = 'p1';
        p1.innerHTML = 'Привет!';

        p2 = document.createElement('p');
        p2.className = 'intro';
        p2.id = 'p2';
        p2.innerHTML = 'Я – модель человека среднего роста (170 см).';

        p3 = document.createElement('p');
        p3.className = 'intro';
        p3.id = 'p3';
        p3.innerHTML = 'Кликни по любой стране, и рядом со мной появится <b>аквариум</b> с тем объемом <b>воды</b>, который <b>каждый житель</b> данной страны потребляет за <b>1 день</b>.';

        p4 = document.createElement('p');
        p4.className = 'intro';
        p4.id = 'p4';
        p4.innerHTML = 'Представь, что я – это ты, и ощути, насколько этот аквариум большой или маленький.';

        p5 = document.createElement('p');
        p5.className = 'intro';
        p5.id = 'p5';
        p5.innerHTML = '<b>Помни:</b> нехватка воды скоро может распространиться почти на всю планету!';

        p6 = document.createElement('p');
        p6.className = 'intro';
        p6.id = 'p6';
        p6.innerHTML = 'Для любознательных: <a href="http://en.wikipedia.org/wiki/Peak_water" target="_blank">Peak Water</a>, <a href="http://worldwater.org/" target="_blank">WorldWater.org</a>.';

        p7 = document.createElement('p');
        p7.className = 'intro';
        p7.id = 'p7';
        p7.innerHTML = '<b>Берегите Природу!</b>';

        bubbleTextIntro.appendChild(p1);
        bubbleTextIntro.appendChild(p2);
        bubbleTextIntro.appendChild(p3);
        bubbleTextIntro.appendChild(p4);
        bubbleTextIntro.appendChild(p5);
        bubbleTextIntro.appendChild(p6);
        bubbleTextIntro.appendChild(p7);
    } else {
        removeIntro();
        appendIntro();
    };  
}

function removeIntro() {
    clickHelp = false;
    while (bubbleTextIntro.firstChild) { bubbleTextIntro.removeChild(bubbleTextIntro.firstChild); }
}

// total.text("Общее потребление: " + numeral(totalById[d.id]).format('0,0') + " м. куб. / год");
// totalCapita.text("На душу населения: " + numeral(consumeById[d.id]).format('0,0') + " м. куб. / год");
// domestic.text("Бытовые расходы: " + numeral(domesticById[d.id]).format('0,0') + " м. куб. / год / чел");
// industrial.text("Производство: " + numeral(industrById[d.id]).format('0,0') + " м. куб. / год / чел");
// agricultural.text("Сельское хозяйство: " + numeral(agricultById[d.id]).format('0,0') + " м. куб. / год / чел");
// population.text("Население страны: " + numeral(popById[d.id]).format('0,0') + " человек");

// блок 2
        // total = d3.select("#dataContainer").append("h4"),
        // totalCapita = d3.select("#dataContainer").append("h4"),
        // domestic = d3.select("#dataContainer").append("h4"),
        // industrial = d3.select("#dataContainer").append("h4"),
        // agricultural = d3.select("#dataContainer").append("h4"),
        // population = d3.select("#dataContainer").append("h4"),