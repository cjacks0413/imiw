require 'json'

routes = File.read('all_routes.json'); 
input = CSV.read(ARGV[1]);

sites_hash = JSON.parse(cornu); 

# foreach line in input 
# if path exist from input[i][1] - input[i][2], 
# proportion = meters / total 

# output: average meter / total ratio 




