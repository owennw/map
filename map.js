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

    d3.json('world.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var countries = topojson.feature(world, world.objects.countries);
        var capitals = topojson.feature(world, world.objects.capitals);

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
                .attr('class', 'city')
                .text(function(d) { return d.properties.name; });
            capitalGroups.append('text')
                .attr('class', 'city-label')
                .attr('transform', function(d) { return 'translate(' + projection(d.geometry.coordinates) + ')rotate(' + -axialTilt + ')'; })
                //.attr('x', function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
                //.attr('dy', '.35em')
                //.style('text-anchor', function(d) { return d.geometry.coordinates[0] > -1 ? 'start' : 'end'; })
                .text(function(d) { return d.properties.name; });

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
