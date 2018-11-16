library(tidyverse)
library(jsonlite)
library(readxl)

summary_file <- "/home/alec/Projects/Brookings/black-devaluation/build/data/Main_Summary_Data_Devaluation_by_MSA(final).xlsx"
neighborhood_file <- "/home/alec/Projects/Brookings/black-devaluation/build/data/Compare Neighborhood Types by MSA.xlsx"

summary_nms <- read_xlsx(summary_file, range="A1:M1", col_names=FALSE, na=c("","N/A")) %>% gather() %>% pull("value")
nms <- c("cbsa", "cbsaname", "zil_deval_blk50_3", "kfr_black_pooled_p25", 
         "racialanimus", "dis", "zil_deval_blk50_1", "pop2012_2016", "black2012_2016", 
         "pct_black2012_2016", "rank_pop", "price_actual", "price_estimated")

summary <- read_xlsx(summary_file, range="A3:M115", col_names=nms, na=c("","N/A"))

neighborhood <- read_xlsx(neighborhood_file, col_names=paste0("X",1:19), skip=1)
neighborhood_nms <- read_xlsx(neighborhood_file, col_names=paste0("X",1:19), n_max=1) %>% as.data.frame() %>% unbox()

unik <- unique(summary$cbsa) %>% sort()
unikB <- unique(neighborhood$X1) %>% sort()
sum(unik %in% unikB)

expo <- tibble(X4=c("Less1", "B1_5", "B5_10", "B10_20", "B20_50", "Major"))

ones <- neighborhood %>% group_by(X1, X2) %>% summarise(n=n())

all <- lapply(unik, function(code){
  
  d <- summary %>% filter(cbsa==code) %>% as.data.frame()

  dd_ <- neighborhood %>% filter(X1==code) %>% full_join(expo, ., by="X4") %>% as.data.frame() 
  
  nobs <- paste0("Metro summary obs: ", nrow(d), " | Neighborhood obs: ", nrow(dd_), "\n")
  if(nrow(d) != 1 || nrow(dd_) != 6){
    cat(nobs)
  }
  
  dd <- dd_ %>% split(.$X4) %>% lapply(function(row){
    return(unbox(row))
  })
  
  return(list(summary=unbox(d), neighborhood=dd))
})

json <- toJSON(all, na="null", digits=5, pretty=TRUE)
dict <- toJSON(neighborhood_nms, na="null", pretty=TRUE)

writeLines(c("var all_data = ", json, ";", 
             "var names = ", dict, ";",
             "export {all_data, names};", ""), con="/home/alec/Projects/Brookings/black-devaluation/build/js/all-data.js")
