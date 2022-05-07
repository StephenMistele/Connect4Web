#check if a player left
#queue of visitors?
class CowController < ApplicationController
  # gameid -> board, player1id, player2id, turn (1/2)
  @@games = Hash.new
  @@players = Hash.new
  @@gametimes = Hash.new

  def gettop(grid, col)
    for x in 0..5
      if (grid[x][col] != 0)
        return x
      end
    end
    return 5
  end
  
  #driver function for checking wins
  def checkIfWon(playerTurn, grid, col)
    row = gettop(grid, col)
    won = 0
    won += wonH(row, playerTurn, grid)
    won += wonV(col, playerTurn, grid)
    won += wonDiagDecrease(row, col, playerTurn, grid)
    won += wonDiagIncrease(row, col, playerTurn, grid)
    print("WON=", won)
    return won
  end
  
  #check if horizontal win on row of most recent piece played
  def wonH(row, playerTurn, grid)
    count = 0
    for x in 0..6
      if grid[row][x] == playerTurn
          count+=1
          if count == 4
              return 1
          end
      else
          count = 0
      end
    end
    return 0
  end
  
  #check if vertical win on col of most recent piece played
  def wonV(col, playerTurn, grid)
    count = 0
    for y in 0..5
      if grid[y][col] == playerTurn
          count+=1
          if count == 4
              return 1
          end
      else
          count = 0
      end
    end
    return 0
  end
  
  #check if diagonal decreasing win on row/col of most recent piece played
  def wonDiagDecrease(row, col, playerTurn, grid)
      count = 0
      #move cursor to top left most value on relevent diagonal
      while row > 0 && col > 0
          row-=1
          col-=1
      end
      #move cursor down/right checking for win
      while row < 5 && col < 6
          if grid[row][col] == playerTurn
              count+=1
              if count == 4
                  return 1
              end
          else
              count = 0
          end
          row+=1
          col-=1
      end
      return 0
  end
  
  #check if diagonal increasing win on row/col of most recent piece played
  def wonDiagIncrease(row, col, playerTurn, grid)
      count = 0
      #move cursor to top right most value on relevent diagonal
      while row > 0 && col < 6
          row-=1
          col+=1
      end
      #move cursor down/left checking for win
      while row < 5 && col > 0
          if grid[row][col] == playerTurn
              count+=1
              if count == 4
                  return 1
              end
          else
              count = 0
          end
          row+=1
          col-=1
      end
      return 0
  end

  #********************************************************************************
  #********************************************************************************

  #try insert a puck into a given row
  def insert(gameid, player, col)
    grid = @@games[gameid][0]
    successful = 1
    #Full Col
    if (grid[0][col] != 0)
      successful = 0
    #Empty Col
    elsif (grid[5][col] == 0)
      grid[5][col] = player
      successful = 1
    #Regular insert
    else
      for x in 0..5
        if (grid[x+1][col] != 0)
          grid[x][col] = player
          successful = 1
          break
        end
      end
    end
    @@games[gameid][0] = grid
    return successful
  end

  #return player turn
  def getplayer(playerid, gameid)
    if (@@games[gameid][1] == playerid)
      return 1
    elsif (@@games[gameid][2] == playerid)
      return 2
    end
  end

  #change turn
  def changeturn(gameid)
    if @@games[gameid][3] == 1
      @@games[gameid][3] = 2
    else
      @@games[gameid][3] = 1
    end
  end

  def move(col, playerid, gameid)
    #check if right turn
    if (checkturn(playerid, gameid) == 1)
      #try insert piece
      playernum = getplayer(playerid, gameid)
      inserted = insert(gameid, playernum, col)

      grid = @@games[gameid][0]
      print("\n\n\n\n")
      for item in grid
        print(item, "\n")
      end
      print("\n\n\n")
      
      if (inserted == 1)
        changeturn(gameid)
        #check if won
        if (checkIfWon(playernum, grid, col) > 0)
          player1 = @@games[gameid][1]
          player2 = @@games[gameid][2]
          @@players.delete(1)
          @@players.delete(2)
          @@games.delete(gameid)
          return "Game won"
        else
          return "Inserted"
        end
      end
      return "Failed to insert"
    elsif (checkturn(playerid, gameid) == 0)
      return "Not your move"
    else
      return "Game over"
    end
  end

  def createboard(playerid, gameid)
    if (@@games.has_key?(gameid))         #if game room already exists
      if !@@games[gameid].kind_of?(Array) #if game room only has 1 player
        hostid = @@games[gameid]
        row, col, default_value = 6, 7, 0
        board = Array.new(row){Array.new(col,default_value)}
        values = [board, hostid, playerid, 1]
        @@games[gameid] = values
        return "game joined"
      else                                #if game room has 2 players already
        return "game full"
      end
    else                                  #if game room doesn't exist
      @@games[gameid] = playerid
      @@gametimes[gameid] = DateTime.now
      return "new game created"
    end
  end

  def debug(gameid)
    print("GAMES*****************************************************", @@games, "\n")
    print("PLAYERS*****************************************************", @@players, "\n")
    print("GAMETIMES*****************************************************", @@gametimes, "\n")
    return @@games[gameid]
  end

  def checkturn(playerid, gameid)
    #if game doesn't exist (you lost) return -1
    if (!@@games.has_key?(gameid))
      return -1
    end
    #return 1 for 'your move' 0 for not
    playermove = @@games[gameid][3]
    if playerid == @@games[gameid][playermove]
      return 1
    end
    return 0
  end

  #return new unique gameid
  def generategameID()
    id = rand(100000..999999)
    while (@@games.has_key?(id))
      id = rand(100000..999999)
    end
    @@gametimes[id] = DateTime.now
    return id
  end

  #return new unique playerid
  def generateplayerID()
    id = rand(100000..999999)
    while (@@players.has_key?(id))
      id = rand(100000..999999)
    end
    @@players[id] = DateTime.now
    return id
  end

  #update time stamps for player and game id's so they don't get erased during memory cleanup
  def updaterelevantIDs(playerid, gameid)
    if @@gametimes.has_key?(gameid)
      @@gametimes[gameid] = DateTime.now
    end
    if @@players.has_key?(playerid)
      @@players[playerid] = DateTime.now
    end
    return 0
  end

  #delete any games or players that have been inactive for more than 1 hour
  def cleanmemory()
    playerstodelete = []
    for key in @@players
      if TimeDifference.between(DateTime.now, key[1]).in_seconds > 10#((DateTime.now - key[1])*24*60*60 > 10)
        playerstodelete.push(key[0])
      else
        print("\n decided not to delete ", TimeDifference.between(DateTime.now, key[1]).in_seconds, "\n")
        print((DateTime.now - key[1])*24*60*60)
      end
    end
    for item in playerstodelete
      @@players.delete(item)
      print("\n DELETING ", item, "\n")
    end

    gamestodelete = []
    for key in @@gametimes
      if TimeDifference.between(DateTime.now, key[1]).in_seconds > 10#((DateTime.now - key[1])*24*60*60 > 10)
        gamestodelete.push(key[0])
      else
        print("\n decided not to delete ", key, "\n")
      end
    end
    for item in gamestodelete
      @@games.delete(item)
      @@gametimes.delete(item)
      print("\n DELETING ", item, "\n")
    end
  end

  def say

    # #temp code
    # createboard(10, 100)
    # createboard(20, 100)
    # move(6, 10, 100)
    # move(5, 20, 100)
    # move(5, 10, 100)
    # move(4, 20, 100)
    # move(3, 10, 100)
    # move(4, 20, 100)
    # move(3, 10, 100)
    # move(3, 20, 100)
    # move(3, 10, 100)
    # move(1, 20, 100)
    # move(4, 10, 100)


    col = params[:col]
    playerid = params[:playerid]
    gameid = params[:gameid]
    flag = params[:flag]

    updaterelevantIDs(playerid, gameid)

    if (flag == 1)
      @message = createboard(playerid, gameid)
    elsif (flag == 2)
      @message = checkturn(playerid, gameid)
    elsif (flag == 3)
      @message = generateplayerID()
    elsif (flag == 4)
      @message = generategameID()
    elsif (flag == 5)
      @message = cleanmemory()
    elsif (flag == 6)
      @message = debug(gameid)
    else 
      @message = move(col, playerid, gameid)
    end
  end
end

#documentation
#to start, get yourself a playerid with flag 3
#to create a new game, flag 4 for a new game id, and then flag 1 with your player and game id
#to join a game, flag 1 with the user entered ID and your player id to enter the game
#if it's your turn, flag 0 with row,game,player id to move
#if it's not your turn, flag 2 to check turn change with game/player id