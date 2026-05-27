export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

// 操作頻度の制限超過（例: 投稿の連投クールダウン）。営業時間 (ForbiddenError) とは
// 別概念で、時間が経てば再試行可能であることを呼び出し側 / UI に区別させるための型。
export class RateLimitError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}
