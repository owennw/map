(function() {
    var width = 1600,
        height = 900,
        axialTilt = -23.4;

    var projection = d3.geo.orthographic()
        .translate([width / 2, height / 2])
        .scale(400)
        .clipAngle(90)
        .rotate([0, 0, axialTilt]); // yaw, pitch, roll
    var path = d3.geo.path().projection(projection).pointRadius(1.5);
    var graticule = d3.geo.graticule();

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'water')
        .attr('d', path);

    d3.json('world_fewer.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var countries = topojson.feature(world, world.objects.countries);
        var capitals = topojson.feature(world, world.objects.cities);

        var allCountries = svg.selectAll('land')
            .data(countries.features);
        var allCapitals = svg.selectAll('city')
            .data(capitals.features);

        var render = function(path) {
            allCountries.enter()
                .append('path')
                .attr('d', path)
                .attr('class', function(d) { return 'country ' + d.id; });

            var capitalGroups = allCapitals.enter().append('g');
            capitalGroups.append('path')
                .attr('d', path)
                .attr('class', 'city');

            var centerPos = projection.invert([width / 2, height / 2]);
            var arc = d3.geo.greatArc();

            capitalGroups.append('text')
                .attr('class', 'city-label')
                .attr('transform', function (d) {
                    var local = projection(d.geometry.coordinates);
                    x = local[0];
                    y = local[1];
                    var offset = x < width / 2 ? -5 : 5;
                    return 'translate(' + (x + offset) + ',' + (y - 2) + ')rotate(' + -axialTilt + ')';
                })
                .attr('text-anchor', function (d) {
                    var x = projection(d.geometry.coordinates)[0];
                    return x < width / 2 - 20 ? 'end' :
                        x < width / 2 + 20 ? 'middle' :
                        'start';
                })
                .style('display', function(d) {
                    // This prevent the cities not visible on the globe from appearing
                    var d = arc.distance({ source: d.geometry.coordinates, target: centerPos });

                    // 1.57 is ~ half of pi
                    return (d > 1.57) ? 'none' : 'inline';
                })
                .text(function (d) { return d.properties.name; });

            svg.append('path')
                .datum(graticule)
                .attr('class', 'graticule noclicks')
                .attr('d', path);
        };

        render(path);

        //d3.timer(function(elapsed) {
        //    projection.rotate([0.2 * elapsed, 0, axialTilt]);
        //    path = d3.geo.path().projection(projection);
        //    render(path);
        //    return true;
        //}, 1000)
    })
}());
